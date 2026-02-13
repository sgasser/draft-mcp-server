export function buildReviewHTML(params: {
  content: string;
  title: string;
  format: string;
  app: string;
  mcp: string | null;
  port: number;
}): string {
  const { content, title, format, app, mcp, port } = params;

  const appConfig: Record<
    string,
    { label: string; icon: string; color: string; bg: string }
  > = {
    github: { label: "GitHub", icon: "◉", color: "#1a7f37", bg: "#dafbe1" },
    linear: { label: "Linear", icon: "◆", color: "#5e6ad2", bg: "#eef0ff" },
    slack: { label: "Slack", icon: "#", color: "#611f69", bg: "#f4ecf7" },
    email: { label: "Email", icon: "✉", color: "#0969da", bg: "#ddf4ff" },
    generic: { label: "Clipboard", icon: "❐", color: "#57606a", bg: "#f6f8fa" },
  };

  const appInfo = appConfig[app] || appConfig.generic;

  const friendlyMcp: Record<string, string> = {
    "github:create_pull_request": "Create PR on GitHub",
    "github:create_issue": "Create issue on GitHub",
    "linear:create_issue": "Create issue on Linear",
    "slack:post_message": "Post to Slack",
  };
  const mcpLabel = mcp
    ? friendlyMcp[mcp] || mcp.replace(/_/g, " ").replace(/:/g, " → ")
    : "Copy to clipboard";

  const escapedContent = JSON.stringify(content);

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Review — ${escapeHtml(title)}</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>
  <style type="text/tailwindcss">
    @theme {
      --color-accent: ${appInfo.color};
      --color-accent-bg: ${appInfo.bg};
      --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, monospace;
    }
    @layer base {
      .prose h1 { @apply text-2xl font-bold mb-4 pb-3 border-b border-gray-200; }
      .prose h2 { @apply text-xl font-semibold mt-6 mb-3; }
      .prose h3 { @apply text-lg font-semibold mt-5 mb-2; }
      .prose p { @apply mb-3; }
      .prose ul, .prose ol { @apply mb-3 pl-6; }
      .prose li { @apply mb-1; }
      .prose li:has(input[type="checkbox"]) { @apply list-none -ml-5; }
      .prose code { @apply text-sm bg-gray-100 px-1.5 py-0.5 rounded; }
      .prose pre { @apply bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto mb-4; }
      .prose pre code { @apply bg-transparent p-0; }
      .prose blockquote { @apply border-l-3 border-accent pl-4 text-gray-600 italic mb-3; }
      .prose a { @apply text-accent hover:underline; }
      .prose table { @apply w-full border-collapse mb-4 text-sm; }
      .prose th, .prose td { @apply border border-gray-200 px-3 py-2 text-left; }
      .prose th { @apply bg-gray-50 font-semibold; }
      .prose input[type="checkbox"] { @apply mr-2 accent-accent; }
      .prose hr { @apply border-t border-gray-200 my-6; }
    }
  </style>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</head>
<body class="h-screen flex flex-col bg-gray-50 text-gray-900 font-sans overflow-hidden"
      x-data="reviewApp()"
      @keydown.meta.enter.window.prevent="submit('approve')"
      @keydown.ctrl.enter.window.prevent="submit('approve')"
      @keydown.escape.window.prevent="submit('reject')">

  <!-- Header -->
  <header class="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
    <div class="flex items-center gap-3">
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style="background: ${appInfo.bg}; color: ${appInfo.color}">
        <span class="text-[10px]">${appInfo.icon}</span>
        ${appInfo.label}
      </span>
      <span class="text-sm font-semibold">${escapeHtml(title)}</span>
    </div>
    <span class="text-xs text-gray-500 font-mono bg-gray-100 px-2.5 py-1 rounded">${mcpLabel}</span>
  </header>

  <!-- Main Content -->
  <main class="flex-1 grid grid-cols-2 gap-px bg-gray-200 overflow-hidden min-h-0 max-md:grid-cols-1 max-md:grid-rows-2">

    <!-- Editor Pane -->
    <div class="flex flex-col bg-gray-50 overflow-hidden">
      <div class="px-5 py-2.5 border-b border-gray-200 shrink-0">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Editor</span>
      </div>
      <div class="flex-1 overflow-auto">
        <textarea
          x-model="content"
          x-ref="editor"
          spellcheck="true"
          placeholder="Start typing..."
          class="w-full h-full bg-transparent border-none text-sm font-mono leading-relaxed p-5 resize-none outline-none placeholder:text-gray-400"
        ></textarea>
      </div>
    </div>

    <!-- Preview Pane -->
    <div class="flex flex-col bg-white overflow-hidden">
      <div class="px-5 py-2.5 border-b border-gray-200 shrink-0">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Preview</span>
      </div>
      <div class="flex-1 overflow-auto p-6">
        <div x-html="preview" class="prose max-w-none text-[15px] leading-relaxed"></div>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200 shrink-0">
    <div class="flex items-center gap-4 text-xs text-gray-500">
      <span class="px-2 py-0.5 rounded bg-gray-100 text-[10px] font-semibold uppercase tracking-wide text-gray-600">${format}</span>
      <span class="font-mono text-[11px]" x-text="words + ' words · ' + content.length + ' chars'"></span>
      <div class="hidden sm:flex items-center gap-3">
        <span class="flex items-center gap-1">
          <kbd class="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-300 text-[10px] font-mono font-medium shadow-sm">⌘</kbd>
          <kbd class="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-300 text-[10px] font-mono font-medium shadow-sm">Enter</kbd>
          <span class="ml-1">approve</span>
        </span>
        <span class="flex items-center gap-1">
          <kbd class="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-300 text-[10px] font-mono font-medium shadow-sm">Esc</kbd>
          <span class="ml-1">reject</span>
        </span>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button @click="submit('reject')" class="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
        Reject
      </button>
      <button @click="copy()" class="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-100 transition-colors">
        Copy
      </button>
      <button @click="submit('approve')" class="px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm">
        ${mcp ? "Approve" : "Approve & Copy"}
      </button>
    </div>
  </footer>

  <!-- Toast -->
  <div x-show="toast"
       x-text="toastMsg"
       x-transition:enter="transition ease-out duration-200"
       x-transition:enter-start="opacity-0 translate-y-2"
       x-transition:enter-end="opacity-100 translate-y-0"
       x-transition:leave="transition ease-in duration-150"
       x-transition:leave-start="opacity-100 translate-y-0"
       x-transition:leave-end="opacity-0 translate-y-2"
       class="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-lg pointer-events-none">
  </div>

  <script>
    function reviewApp() {
      return {
        content: ${escapedContent},
        toast: false,
        toastMsg: '',
        format: '${format}',
        hasMcp: ${!!mcp},
        apiBase: 'http://localhost:${port}',

        get words() {
          return this.content.trim().split(/\\s+/).filter(Boolean).length;
        },

        get preview() {
          if (this.format === 'md') return marked.parse(this.content);
          if (this.format === 'html') return this.content;
          return '<pre class="whitespace-pre-wrap font-mono text-sm">' + this.escapeHtml(this.content) + '</pre>';
        },

        escapeHtml(s) {
          return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        },

        showToast(msg) {
          this.toastMsg = msg;
          this.toast = true;
          setTimeout(() => this.toast = false, 2000);
        },

        async copy() {
          await navigator.clipboard.writeText(this.content);
          this.showToast('Copied to clipboard');
        },

        async submit(action) {
          if (action === 'copy' || (action === 'approve' && !this.hasMcp)) {
            await this.copy();
            if (action === 'copy') return;
          }

          await fetch(this.apiBase + '/api/respond', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, content: this.content })
          });

          const isApproved = action === 'approve';
          document.body.innerHTML = \`
            <div class="flex flex-col items-center justify-center h-screen gap-4 bg-white">
              <span class="text-5xl \${isApproved ? 'text-green-600' : 'text-red-500'}">\${isApproved ? '✓' : '✗'}</span>
              <span class="text-xl font-semibold">\${isApproved ? 'Done' : 'Cancelled'}</span>
              <span class="text-sm text-gray-500">You can close this tab</span>
            </div>
          \`;
        },

        init() {
          this.$refs.editor.focus();
        }
      }
    }
  </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
