import http.server
import socketserver

PORT = 3000

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    pass

# Принудительно задаем правильный MIME-тип для модулей JavaScript, обходя баг Windows
CustomHandler.extensions_map['.js'] = 'application/javascript'

with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
    print(f"Server running at http://localhost:{PORT}")
    httpd.serve_forever()
