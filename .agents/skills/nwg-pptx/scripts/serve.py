import http.server
import json
import socketserver
import sys
from pathlib import Path

START_PORT = 4567
MAX_PORT = 4577
ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd().resolve()

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        if self.path == '/save-feedback':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                parsed = json.loads(body.decode('utf-8'))
                (ROOT / 'feedback.json').write_text(json.dumps(parsed, indent=2) + '\n', encoding='utf-8')
            except Exception as exc:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(str(exc).encode('utf-8'))
                return
            self.send_response(204)
            self.end_headers()
            return
        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    for port in range(START_PORT, MAX_PORT + 1):
        try:
            with socketserver.TCPServer(('', port), Handler) as httpd:
                url = f'http://localhost:{port}/review-playground.html'
                print(f'\n{"─" * 54}')
                print(f'  Review playground: {url}')
                print(f'{"─" * 54}\n')
                httpd.serve_forever()
        except OSError:
            continue
    raise SystemExit(f'No available port in {START_PORT}-{MAX_PORT}')
