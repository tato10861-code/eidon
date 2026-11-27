// Package eidon provides the official Go SDK for the Eidon AI employee platform.
package eidon

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const version = "0.1.0"
const defaultBaseURL = "https://eidon.ai"

// Client is the Eidon API client.
type Client struct {
	apiKey  string
	baseURL string
	http    *http.Client
}

// New creates a new Eidon client.
func New(apiKey string, opts ...Option) *Client {
	c := &Client{
		apiKey:  apiKey,
		baseURL: defaultBaseURL,
		http:    &http.Client{Timeout: 30 * time.Second},
	}
	for _, o := range opts {
		o(c)
	}
	return c
}

// Option configures the client.
type Option func(*Client)

// WithBaseURL sets a custom base URL.
func WithBaseURL(u string) Option {
	return func(c *Client) { c.baseURL = strings.TrimRight(u, "/") }
}

// WithTimeout sets the HTTP timeout.
func WithTimeout(d time.Duration) Option {
	return func(c *Client) { c.http.Timeout = d }
}

// Message is a chat turn.
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// Employee represents an AI employee.
type Employee struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Role        string `json:"role"`
	Description string `json:"description,omitempty"`
}

// ChatResponse is the full response from Chat().
type ChatResponse struct {
	EmployeeID string    `json:"employeeId"`
	Model      string    `json:"model"`
	Text       string    `json:"text"`
	Tokens     int       `json:"tokens"`
	LatencyMs  int       `json:"latencyMs"`
	Messages   []Message `json:"messages"`
}

// StreamChunk is one SSE event from the chat stream.
type StreamChunk struct {
	Type  string `json:"type"`
	Text  string `json:"text,omitempty"`
	Model string `json:"model,omitempty"`
	Usage *struct {
		Tokens    int `json:"tokens"`
		LatencyMs int `json:"latencyMs"`
	} `json:"usage,omitempty"`
	Error string `json:"error,omitempty"`
}

// ChatOptions are optional parameters for Chat and Stream calls.
type ChatOptions struct {
	EmployeeID     string
	WorkspaceID    string
	ConversationID string
}

func (c *Client) headers() map[string]string {
	return map[string]string{
		"Authorization": "Bearer " + c.apiKey,
		"Content-Type":  "application/json",
		"User-Agent":    "eidon-go/" + version,
	}
}

// ListEmployees returns all available employees.
func (c *Client) ListEmployees(ctx context.Context) ([]Employee, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/api/employees", nil)
	if err != nil {
		return nil, err
	}
	for k, v := range c.headers() {
		req.Header.Set(k, v)
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, body)
	}
	var result struct {
		Employees []Employee `json:"employees"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return result.Employees, nil
}

// Chat sends messages and returns the complete response.
func (c *Client) Chat(ctx context.Context, messages []Message, opts *ChatOptions) (*ChatResponse, error) {
	var text strings.Builder
	var model string
	var tokens, latencyMs int

	err := c.Stream(ctx, messages, opts, func(chunk StreamChunk) error {
		switch chunk.Type {
		case "delta":
			text.WriteString(chunk.Text)
		case "meta":
			model = chunk.Model
		case "done":
			if chunk.Usage != nil {
				tokens = chunk.Usage.Tokens
				latencyMs = chunk.Usage.LatencyMs
			}
		case "error":
			return fmt.Errorf("stream error: %s", chunk.Error)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	employeeID := ""
	if opts != nil {
		employeeID = opts.EmployeeID
	}

	fullText := text.String()
	return &ChatResponse{
		EmployeeID: employeeID,
		Model:      model,
		Text:       fullText,
		Tokens:     tokens,
		LatencyMs:  latencyMs,
		Messages:   append(messages, Message{Role: "assistant", Content: fullText}),
	}, nil
}

// Stream calls fn for each SSE chunk. It blocks until the stream is done or ctx is cancelled.
func (c *Client) Stream(ctx context.Context, messages []Message, opts *ChatOptions, fn func(StreamChunk) error) error {
	payload := map[string]any{"messages": messages}
	if opts != nil {
		if opts.EmployeeID != "" {
			payload["employeeId"] = opts.EmployeeID
		}
		if opts.WorkspaceID != "" {
			payload["workspaceId"] = opts.WorkspaceID
		}
		if opts.ConversationID != "" {
			payload["conversationId"] = opts.ConversationID
		}
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/api/chat", bytes.NewReader(body))
	if err != nil {
		return err
	}
	for k, v := range c.headers() {
		req.Header.Set(k, v)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, b)
	}

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		raw := strings.TrimPrefix(line, "data: ")
		if raw == "" || raw == "[DONE]" {
			continue
		}
		var chunk StreamChunk
		if err := json.Unmarshal([]byte(raw), &chunk); err != nil {
			continue
		}
		if err := fn(chunk); err != nil {
			return err
		}
	}
	return scanner.Err()
}
