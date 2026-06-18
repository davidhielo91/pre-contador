"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

interface PreviewRow {
  row: number;
  nombre: string;
  telefono: string;
  correo: string;
  edad: string;
  ciudad: string;
  temaInteres: string;
  situacion: string;
  valido: boolean;
}

interface ImportResult {
  procesados: number;
  creados: number;
  duplicados: number;
  errores: number;
  detalleErrores: { fila: number; error: string }[];
}

export function ImportDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback(async (f: File) => {
    setFile(f);
    setResult(null);
    const buffer = await f.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array", raw: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const rows: PreviewRow[] = data.slice(0, 10).map((r, i) => {
      const keys = Object.keys(r);
      const get = (aliases: string[]) => {
        for (const a of aliases) {
          const found = keys.find((k) => k.toLowerCase().trim() === a.toLowerCase().trim());
          if (found) return String(r[found] ?? "");
        }
        return "";
      };
      const nombre = get(["nombre", "name", "nombre completo"]);
      const telefono = get(["telefono", "teléfono", "tel", "phone"]);
      const correo = get(["correo", "email", "mail"]);
      const edad = get(["edad", "age"]);
      const ciudad = get(["ciudad", "city"]);
      const temaInteres = get(["tema", "tema de interés", "tema de interes", "tema interés", "tema interes", "interest"]);
      const situacion = get(["situacion", "situación", "situación que comenta", "situation", "comentario"]);
      const valido = !!(nombre && telefono && edad && ciudad && temaInteres && situacion);
      return { row: i + 2, nombre, telefono, correo, edad, ciudad, temaInteres, situacion, valido };
    });
    setPreview(rows);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && [".xlsx", ".xls", ".csv"].some((ext) => f.name.endsWith(ext))) {
      parseFile(f);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) parseFile(f);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/leads/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setResult({
          procesados: 0,
          creados: 0,
          duplicados: 0,
          errores: 1,
          detalleErrores: [{ fila: 0, error: data.error || "Error del servidor" }],
        });
      } else {
        setResult(data);
      }
      router.refresh();
    } catch {
      setResult({
        procesados: 0, creados: 0, duplicados: 0, errores: 1,
        detalleErrores: [{ fila: 0, error: "Error de conexión" }],
      });
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview([]);
    setResult(null);
    setImporting(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="h-3.5 w-3.5" />
          Importar
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar leads desde Excel</DialogTitle>
          <DialogDescription>
            Sube un archivo .xlsx, .xls o .csv con los datos de los prospectos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 cursor-pointer transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-muted/10"
              }`}
            >
              <FileSpreadsheet className="h-10 w-10 text-muted" />
              <div className="text-center">
                <p className="text-sm font-medium text-card-foreground">
                  Arrastra tu archivo aquí
                </p>
                <p className="text-xs text-muted mt-1">
                  o da clic para seleccionar · .xlsx, .xls, .csv
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button onClick={reset} className="p-1 hover:bg-muted/20 rounded transition-colors">
                  <X className="h-4 w-4 text-muted" />
                </button>
              </div>

              {preview.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted mb-2">
                    Vista previa ({preview.length} filas)
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>#</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Edad</TableHead>
                          <TableHead>Ciudad</TableHead>
                          <TableHead>Tema</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.map((row) => (
                          <TableRow key={row.row} className={row.valido ? "" : "bg-destructive/5"}>
                            <TableCell className="text-xs text-muted">{row.row}</TableCell>
                            <TableCell className="text-xs font-medium">{row.nombre || "—"}</TableCell>
                            <TableCell className="text-xs">{row.telefono || "—"}</TableCell>
                            <TableCell className="text-xs">{row.edad || "—"}</TableCell>
                            <TableCell className="text-xs">{row.ciudad || "—"}</TableCell>
                            <TableCell className="text-xs">{row.temaInteres || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          {result && (
            <div className={`rounded-lg border p-4 ${
              result.errores > 0 && result.creados === 0
                ? "border-destructive/30 bg-destructive/5"
                : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {result.errores > 0 && result.creados === 0 ? (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                )}
                <p className="text-sm font-medium">
                  {result.errores > 0 && result.creados === 0
                    ? "Error en la importación"
                    : "Importación completada"}
                </p>
              </div>
              <div className="text-xs text-muted space-y-0.5">
                <p>Procesados: <span className="font-medium text-card-foreground">{result.procesados}</span></p>
                <p>Creados: <span className="font-medium text-green-600 dark:text-green-400">{result.creados}</span></p>
                <p>Duplicados: <span className="font-medium text-amber-600">{result.duplicados}</span></p>
                {result.errores > 0 && (
                  <p>Errores: <span className="font-medium text-destructive">{result.errores}</span></p>
                )}
              </div>
              {result.detalleErrores.length > 0 && (
                <div className="mt-2 max-h-24 overflow-y-auto space-y-0.5">
                  {result.detalleErrores.map((e, i) => (
                    <p key={i} className="text-[11px] text-destructive">Fila {e.fila}: {e.error}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => { setOpen(false); reset(); }}>
            Cancelar
          </Button>
          {file && !result && (
            <Button size="sm" onClick={handleImport} disabled={importing}>
              {importing ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Importando…</>
              ) : (
                <><Upload className="h-3.5 w-3.5" /> Importar leads</>
              )}
            </Button>
          )}
          {result && (
            <Button size="sm" onClick={() => { setOpen(false); reset(); }}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
