import http.server, json, os, base64, urllib.request, urllib.error

PORT = 5000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, 'static')
SETTINGS_FILE = os.path.join(BASE_DIR, 'settings.json')

class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {fmt % args}", flush=True)

    def _send_json(self, data, code=200):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(body))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        path = self.path.split('?')[0]
        if path == '/' or path == '/index.html':
            self._serve_file(os.path.join(STATIC_DIR, 'index.html'), 'text/html')
        elif path.startswith('/static/'):
            self._serve_file(os.path.join(STATIC_DIR, path[8:]))
        elif path == '/api/settings':
            self._handle_get_settings()
        else:
            self.send_error(404)

    def _serve_file(self, fp, ctype=None):
        if not os.path.exists(fp):
            return self.send_error(404)
        if ctype is None:
            ext = os.path.splitext(fp)[1].lower()
            ctype = {'.html':'text/html','.css':'text/css','.js':'application/javascript',
                     '.png':'image/png','.jpg':'image/jpeg'}.get(ext, 'application/octet-stream')
        with open(fp, 'rb') as f:
            data = f.read()
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', len(data))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        path = self.path.split('?')[0]
        if path == '/api/generate':
            self._handle_generate()
        elif path == '/api/settings':
            self._handle_save_settings()
        elif path == '/api/save':
            self._handle_save_image()
        else:
            self.send_error(404)

    def _handle_get_settings(self):
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                self._send_json(json.load(f))
        else:
            self._send_json({})

    def _handle_save_settings(self):
        length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(length))
        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(body, f, ensure_ascii=False, indent=2)
        self._send_json({'ok': True})

    def _handle_save_image(self):
        length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(length))
        b64_data = body.get('b64', '')
        filename = body.get('filename', 'image.png')
        save_dir = body.get('save_dir', '')
        if not save_dir or not b64_data:
            self._send_json({'error': 'missing save_dir or b64'}, 400)
            return
        os.makedirs(save_dir, exist_ok=True)
        # Avoid overwrite by appending number
        base, ext = os.path.splitext(filename)
        out_path = os.path.join(save_dir, filename)
        counter = 1
        while os.path.exists(out_path):
            out_path = os.path.join(save_dir, f"{base}_{counter}{ext}")
            counter += 1
        with open(out_path, 'wb') as f:
            f.write(base64.b64decode(b64_data))
        self._send_json({'ok': True, 'path': out_path})

    def _handle_generate(self):
        length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(length))

        api_key = body.get('api_key', '')
        api_base = body.get('api_base', 'https://www.hfsyapi.cn').rstrip('/')
        prompt = body.get('prompt', '')
        size = body.get('size', '1280x720')
        ref_b64s = body.get('reference_images', [])

        payload = {
            "model": "gpt-image-2",
            "prompt": prompt,
            "size": size,
            "n": 1,
            "response_format": "b64_json",
        }
        if ref_b64s:
            payload["reference_images"] = ref_b64s[:6]

        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            f"{api_base}/v1/images/generations",
            data=data,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            method='POST'
        )

        try:
            with urllib.request.urlopen(req, timeout=600) as resp:
                result = json.loads(resp.read())
            images = []
            for item in result.get('data', []):
                if 'b64_json' in item:
                    images.append(item['b64_json'])
                elif 'url' in item:
                    img_data = urllib.request.urlopen(item['url'], timeout=60).read()
                    images.append(base64.b64encode(img_data).decode())
            self._send_json({'images': images})
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors='replace')[:500]
            self._send_json({'error': f'API {e.code}', 'detail': detail}, e.code)
        except Exception as e:
            self._send_json({'error': str(e)}, 500)

if __name__ == '__main__':
    print(f"ImageGen Tool: http://localhost:{PORT}", flush=True)
    server = http.server.ThreadingHTTPServer(('0.0.0.0', PORT), Handler)
    server.serve_forever()
