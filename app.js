/**
 * Arquivo de entrada para hospedagens Node.js (cPanel/DirectAdmin Node.js Selector).
 * Carrega o servidor standalone gerado pelo Next.js.
 */
const path = require("path");

// Garante que o Next.js encontre os arquivos no diretório correto
process.chdir(__dirname);
process.env.NODE_ENV = "production";
process.env.PORT = process.env.PORT || "3000";
process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";

// Carrega o servidor standalone do Next.js
require("./server.js");
