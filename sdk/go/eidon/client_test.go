package eidon_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/tato10861-code/eidon/sdk/go/eidon"
)

func sseServer(events []map[string]any) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		for _, e := range events {
			b, _ := json.Marshal(e)
			fmt.Fprintf(w, "data: %s\n\n", b)
		}
	}))
}

func TestStream(t *testing.T) {
	srv := sseServer([]map[string]any{
		{"type": "meta", "model": "test-model"},
		{"type": "delta", "text": "Hello"},
		{"type": "delta", "text": " Go"},
		{"type": "done", "usage": map[string]int{"tokens": 5, "latencyMs": 100}},
	})
	defer srv.Close()

	client := eidon.New("test-key", eidon.WithBaseURL(srv.URL))
	var got []string
	err := client.Stream(context.Background(), []eidon.Message{{Role: "user", Content: "hi"}}, nil,
		func(c eidon.StreamChunk) error {
			if c.Type == "delta" {
				got = append(got, c.Text)
			}
			return nil
		})
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 2 || got[0] != "Hello" || got[1] != " Go" {
		t.Fatalf("unexpected chunks: %v", got)
	}
}

func TestChat(t *testing.T) {
	srv := sseServer([]map[string]any{
		{"type": "delta", "text": "Hi"},
		{"type": "delta", "text": "!"},
		{"type": "done", "usage": map[string]int{"tokens": 2, "latencyMs": 50}},
	})
	defer srv.Close()

	client := eidon.New("test-key", eidon.WithBaseURL(srv.URL))
	resp, err := client.Chat(context.Background(), []eidon.Message{{Role: "user", Content: "hey"}}, nil)
	if err != nil {
		t.Fatal(err)
	}
	if resp.Text != "Hi!" {
		t.Fatalf("expected 'Hi!' got %q", resp.Text)
	}
}

func TestListEmployees(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"employees": []map[string]any{{"id": "ava", "name": "Ava", "role": "Assistant"}},
		})
	}))
	defer srv.Close()

	client := eidon.New("test-key", eidon.WithBaseURL(srv.URL))
	list, err := client.ListEmployees(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(list) != 1 || list[0].ID != "ava" {
		t.Fatalf("unexpected employees: %v", list)
	}
}
