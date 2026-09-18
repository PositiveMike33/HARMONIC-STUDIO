#!/usr/bin/env python3
"""
mcp-servers/shared/mcp_base.py
Gestionnaire de protocole standard Model Context Protocol (MCP) JSON-RPC 2.0 sur stdio.
Permet d'exposer n'importe quel ensemble d'outils audio vers Antigravity, Claude, Goose et HARMONIC STUDIO.
"""

import json
import sys
import traceback
from typing import Any, Callable


class McpServerBase:
    def __init__(self, server_name: str, version: str = "1.0.0"):
        self.server_name = server_name
        self.version = version
        self.tools: dict[str, dict[str, Any]] = {}
        self.handlers: dict[str, Callable[[dict[str, Any]], dict[str, Any]]] = {}

    def register_tool(
        self,
        name: str,
        description: str,
        parameters_schema: dict[str, Any],
        handler: Callable[[dict[str, Any]], dict[str, Any]]
    ):
        """Enregistre un outil et son schéma de validation."""
        self.tools[name] = {
            "name": name,
            "description": description,
            "inputSchema": parameters_schema
        }
        self.handlers[name] = handler

    def handle_request(self, request: dict[str, Any]) -> dict[str, Any] | None:
        """Traite une requête JSON-RPC 2.0 unitaire."""
        req_id = request.get("id")
        method = request.get("method")
        params = request.get("params", {})

        # Notifications (sans id)
        if req_id is None:
            if method == "notifications/initialized":
                return None
            return None

        # 1. Handshake d'initialisation MCP
        if method == "initialize":
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "serverInfo": {
                        "name": self.server_name,
                        "version": self.version
                    },
                    "capabilities": {
                        "tools": {
                            "listChanged": False
                        }
                    }
                }
            }

        # 2. Énumération des outils
        if method == "tools/list":
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "tools": list(self.tools.values())
                }
            }

        # 3. Exécution d'un outil
        if method == "tools/call":
            tool_name = params.get("name")
            arguments = params.get("arguments", {})

            if tool_name not in self.handlers:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {
                        "code": -32601,
                        "message": f"Outil '{tool_name}' non reconnu par le serveur {self.server_name}"
                    }
                }

            try:
                result_data = self.handlers[tool_name](arguments)
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": json.dumps(result_data, ensure_ascii=False, indent=2)
                            }
                        ],
                        "isError": False
                    }
                }
            except Exception as e:
                err_msg = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "content": [
                            {"type": "text", "text": f"Erreur d'exécution de l'outil {tool_name} : {err_msg}"}
                        ],
                        "isError": True
                    }
                }

        # 4. Ping
        if method == "ping":
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {}
            }

        # Méthode inconnue
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {
                "code": -32601,
                "message": f"Méthode non implémentée: {method}"
            }
        }

    def run_stdio_loop(self):
        """Boucle principale d'écoute stdio JSON-RPC pour MCP."""
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                req = json.loads(line)
                resp = self.handle_request(req)
                if resp is not None:
                    sys.stdout.write(json.dumps(resp, ensure_ascii=False) + "\n")
                    sys.stdout.flush()
            except json.JSONDecodeError:
                err_resp = {
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {"code": -32700, "message": "Parse error (JSON invalide)"}
                }
                sys.stdout.write(json.dumps(err_resp, ensure_ascii=False) + "\n")
                sys.stdout.flush()
            except Exception as e:
                err_resp = {
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {"code": -32603, "message": f"Internal error: {str(e)}"}
                }
                sys.stdout.write(json.dumps(err_resp, ensure_ascii=False) + "\n")
                sys.stdout.flush()
