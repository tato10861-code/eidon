import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Reference — Eidon",
  description:
    "Full REST API reference for Eidon. Authenticate with an API key, embed AI employees, manage workspaces, and stream conversations.",
  alternates: { canonical: "/docs/api" },
};

export default function ApiDocsPage() {
  return (
    <>
      <style>{`
        rapi-doc {
          display: block;
          width: 100%;
          min-height: 100vh;
        }
      `}</style>
      {/* @ts-expect-error — rapi-doc is a custom element registered at runtime */}
      <rapi-doc
        spec-url="/openapi.yaml"
        render-style="read"
        theme="dark"
        bg-color="#090c12"
        text-color="#e8ecf0"
        header-color="#0d1117"
        primary-color="#cbff5a"
        nav-bg-color="#0d1117"
        nav-text-color="#94a3b8"
        nav-hover-bg-color="#161b22"
        nav-hover-text-color="#e8ecf0"
        nav-accent-color="#cbff5a"
        nav-accent-text-color="#090c12"
        font-size="default"
        show-header="true"
        show-info="true"
        allow-authentication="true"
        allow-server-selection="true"
        allow-api-list-style-selection="true"
        show-components="false"
        default-schema-tab="schema"
        response-area-height="400px"
        style={{ width: "100%", minHeight: "100vh" }}
      />
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script
        type="module"
        src="https://unpkg.com/rapidoc@9.3.4/dist/rapidoc-min.js"
        crossOrigin="anonymous"
      />
    </>
  );
}
