"use client";

import React, { useState, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  CircularProgress,
  Chip,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import ReceiptIcon from "@mui/icons-material/Receipt";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import DateRangeIcon from "@mui/icons-material/DateRange";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

export default function AnalizarFacturaPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [base64Data, setBase64Data] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  // Procesamiento del archivo (común para input y drag & drop)
  const processFile = (selectedFile) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    setExtractedData(null);
    setError(null);

    // Generar URL de previsualización real para imágenes y PDFs
    setPreviewUrl(URL.createObjectURL(selectedFile));

    // Convertir a Base64 para enviarlo a la API
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setBase64Data(base64);
      handleAnalyze(base64); // Inicia el análisis automáticamente al terminar de leer
    };
    reader.readAsDataURL(selectedFile);
  };

  // Manejo de la selección del archivo vía input
  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
  };

  // Eventos de Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith("image/") || droppedFile.type === "application/pdf")) {
      processFile(droppedFile);
    } else {
      setError("Por favor, arrastra una imagen o un archivo PDF válido.");
    }
  };

  const handleClearFile = () => {
    // Limpiar la URL del navegador de la memoria para evitar fugas
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setBase64Data("");
    setExtractedData(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Llamada a la API
  const handleAnalyze = async (base64Param) => {
    const dataToSend = typeof base64Param === "string" ? base64Param : base64Data;
    if (!dataToSend) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analizeInvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataToSend }),
      });

      const result = await response.json();

      if (result.success) {
        setExtractedData(result.data);
      } else {
        setError(result.error || "Ocurrió un error al analizar la factura.");
      }
    } catch (err) {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8fafc", py: { xs: 4, md: 8 } }}>
      <Container maxWidth="md">
        {/* Encabezado */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, color: "#0f172a", mb: 2, letterSpacing: "-1px" }}>
            Análisis de Facturas Inteligente
          </Typography>
          <Typography variant="subtitle1" sx={{ color: "#64748b", maxWidth: "600px", mx: "auto", fontSize: "1.1rem" }}>
            Sube tu factura en formato Imagen o PDF y deja que la IA extraiga los datos por ti.
          </Typography>
        </Box>

        {/* Tarjeta de Carga de Archivo */}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, mb: 5, boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)", backgroundColor: "#ffffff" }}>
          {!file ? (
            <Box
              onClick={() => fileInputRef.current.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                border: isDragging ? "2px dashed #5216f4" : "2px dashed #cbd5e1",
                borderRadius: 4,
                p: { xs: 4, md: 8 },
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: isDragging ? "#f3f0ff" : "#ffffff",
                transition: "all 0.2s ease-in-out",
                "&:hover": { backgroundColor: "#f8fafc", borderColor: "#94a3b8" },
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 64, color: isDragging ? "#5216f4" : "#3b82f6", mb: 2, transition: "color 0.2s" }} />
              <Typography variant="h6" sx={{ color: "#1e293b", fontWeight: 700, mb: 1 }}>
                {isDragging ? "Suelta el documento aquí" : "Arrastra y suelta tu documento, o haz clic aquí"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", fontWeight: 500 }}>
                Soporta JPG, PNG y PDF
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: "center" }}>
              <Box sx={{ position: "relative", display: "block", mx: "auto", mb: 3, width: "100%", maxWidth: "700px" }}>
                {file?.type === "application/pdf" ? (
                  <iframe
                    src={previewUrl}
                    title="Previsualización de PDF"
                    style={{ width: "100%", height: "500px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Previsualización"
                    style={{ maxWidth: "100%", maxHeight: "500px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", objectFit: "contain" }}
                  />
                )}
                <IconButton
                  onClick={handleClearFile}
                  sx={{ position: "absolute", top: -16, right: -16, bgcolor: "#ffffff", color: "#ef4444", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", border: "1px solid #fee2e2", "&:hover": { bgcolor: "#fef2f2" } }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              
              {!extractedData && (
                <Box sx={{ mt: 4 }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    onClick={handleAnalyze}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ReceiptIcon />}
                    sx={{ py: 1.5, px: 5, borderRadius: 8, fontWeight: 700, textTransform: "none", fontSize: "1.05rem", boxShadow: "0 8px 16px rgba(82, 22, 244, 0.25)" }}
                  >
                    {loading ? "Analizando con IA..." : "Reintentar Extracción"}
                  </Button>
                </Box>
              )}
            </Box>
          )}
          
          <input
            type="file"
            accept="image/*,application/pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </Paper>

        {/* Mensaje de Error */}
        {error && (
          <Paper elevation={0} sx={{ p: 2.5, bgcolor: "#fef2f2", color: "#dc2626", borderRadius: 3, mb: 4, display: "flex", alignItems: "center", border: "1px solid #fecaca" }}>
            <ErrorIcon sx={{ mr: 1 }} />
            <Typography sx={{ fontWeight: 500 }}>{error}</Typography>
          </Paper>
        )}

        {/* Resultados Extraídos */}
        {extractedData && (
          <Box sx={{ animation: "fadeIn 0.5s ease-in-out" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
                Resultados de la Extracción
              </Typography>
              {extractedData.esFacturaValida ? (
                <Chip icon={<CheckCircleIcon />} label="Factura Válida" color="success" sx={{ fontWeight: 700, borderRadius: 2, px: 1 }} />
              ) : (
                <Chip icon={<ErrorIcon />} label="Documento No Reconocido" color="error" sx={{ fontWeight: 700, borderRadius: 2, px: 1 }} />
              )}
            </Box>

            <Grid container spacing={3}>
              {/* Detalles Principales */}
              <Grid item size={{ xs: 12, md: 6 }}>
                <Card elevation={0} sx={{ height: "100%", borderRadius: 4, border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                      <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#eff6ff", color: "#3b82f6", display: "flex", mr: 2 }}>
                        <BusinessIcon />
                      </Box>
                      <Typography variant="h6" sx={{ color: "#0f172a", fontWeight: 700 }}>Datos del Emisor</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Razón Social</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: "#334155", mt: 0.5 }}>{extractedData.emisorNombre || "N/A"}</Typography>
                    </Box>
                  <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Documento (RIF/NIT)</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: "#334155", mt: 0.5 }}>{extractedData.emisorDocumento || "N/A"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Dirección</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "#334155", mt: 0.5 }}>{extractedData.emisorDireccion || "N/A"}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item size={{ xs: 12, md: 6 }}>
                <Card elevation={0} sx={{ height: "100%", borderRadius: 4, border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                      <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#faf5ff", color: "#8b5cf6", display: "flex", mr: 2 }}>
                        <PersonIcon />
                      </Box>
                      <Typography variant="h6" sx={{ color: "#0f172a", fontWeight: 700 }}>Datos del Receptor</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Razón Social</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: "#334155", mt: 0.5 }}>{extractedData.receptorNombre || "N/A"}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Documento</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: "#334155", mt: 0.5 }}>{extractedData.receptorDocumento || "N/A"}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Info General y Totales */}
              <Grid item size={{xs: 12}}>
                <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", overflow: "hidden" }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Grid container spacing={4} alignItems="center">
                      
                      <Grid item size={{ xs: 12, md: 12 }} >
                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                          <ReceiptIcon sx={{ color: "#cbd5e1", mr: 1.5 }} />
                          <Typography variant="body2" sx={{ color: "#64748b", minWidth: 130, fontWeight: 500 }}>Nº de Factura:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: "#0f172a" }}>{extractedData.numeroFactura || "No encontrado"}</Typography>
                        </Box>
                        <Divider sx={{ my: 1.5, borderStyle: "dashed" }} />
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <DateRangeIcon sx={{ color: "#cbd5e1", mr: 1.5 }} />
                          <Typography variant="body2" sx={{ color: "#64748b", minWidth: 130, fontWeight: 500 }}>Fecha Emisión:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: "#0f172a" }}>{extractedData.fechaEmision || "No encontrada"}</Typography>
                        </Box>
                        {extractedData.horaEmision && (
                          <>
                            <Divider sx={{ my: 1.5, borderStyle: "dashed" }} />
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <AccessTimeIcon sx={{ color: "#cbd5e1", mr: 1.5 }} />
                              <Typography variant="body2" sx={{ color: "#64748b", minWidth: 130, fontWeight: 500 }}>Hora Emisión:</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 700, color: "#0f172a" }}>{extractedData.horaEmision}</Typography>
                            </Box>
                          </>
                        )}
                      </Grid>

                      <Grid item size={{ xs: 12, md: 12 }}>
                        <Box sx={{ background: "linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)", p: 3, borderRadius: 3, border: "1px solid #e2e8f0", borderLeft: "4px solid #5216f4" }}>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 2.5 }}>
                            <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "#ffffff", color: "#10b981", display: "flex", mr: 1.5, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                              <AttachMoneyIcon fontSize="small" />
                            </Box>
                            <Typography variant="h6" sx={{ color: "#0f172a", fontWeight: 800 }}>Resumen Financiero</Typography>
                          </Box>
                          
                          {/* Tarjetas de Moneda */}
                          <Grid container spacing={2} sx={{ mb: 1 }}>
                            {/* Tarjeta Bolívares */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Box sx={{ 
                                p: { xs: 2, sm: 2.5 }, 
                                borderRadius: 3, 
                                bgcolor: "rgba(59, 130, 246, 0.04)", 
                                border: "1px solid rgba(59, 130, 246, 0.15)", 
                                display: "flex", 
                                flexDirection: "column",
                                height: "100%",
                                width: "100%"
                              }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#3b82f6", mr: 1.5 }} />
                                  <Typography variant="subtitle2" sx={{ color: "#2563eb", fontWeight: 800, letterSpacing: "0.5px" }}>BOLÍVARES (Bs.)</Typography>
                                </Box>
                                
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>Subtotal:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155", textAlign: "right" }}>{extractedData.montoSubtotalBs || "-"}</Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>Impuestos:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155", textAlign: "right" }}>{extractedData.impuestosTotalesBs || "-"}</Typography>
                                </Box>
                                <Box sx={{ mt: "auto" }}>
                                  <Divider sx={{ my: 1.5, borderColor: "rgba(59, 130, 246, 0.15)" }} />
                                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: "#1e293b" }}>TOTAL:</Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#2563eb", textAlign: "right" }}>{extractedData.montoTotalBs || "-"}</Typography>
                                  </Box>
                                </Box>
                              </Box>
                            </Grid>

                            {/* Tarjeta Dólares */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Box sx={{ 
                                p: { xs: 2, sm: 2.5 }, 
                                borderRadius: 3, 
                                bgcolor: "rgba(16, 185, 129, 0.04)", 
                                border: "1px solid rgba(16, 185, 129, 0.15)", 
                                display: "flex", 
                                flexDirection: "column",
                                height: "100%"
                              }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10b981", mr: 1.5 }} />
                                  <Typography variant="subtitle2" sx={{ color: "#059669", fontWeight: 800, letterSpacing: "0.5px" }}>DÓLARES (USD)</Typography>
                                </Box>
                                
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>Subtotal:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155", textAlign: "right" }}>{extractedData.montoSubtotalUsd || "-"}</Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>Impuestos:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155", textAlign: "right" }}>{extractedData.impuestosTotalesUsd || "-"}</Typography>
                                </Box>
                                <Box sx={{ mt: "auto" }}>
                                  <Divider sx={{ my: 1.5, borderColor: "rgba(16, 185, 129, 0.15)" }} />
                                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: "#1e293b" }}>TOTAL:</Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#059669", textAlign: "right" }}>{extractedData.montoTotalUsd || "-"}</Typography>
                                  </Box>
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>

                          {extractedData.tasaDeCambio && (
                            <Box sx={{ mt: 3, p: { xs: 1.5, sm: 2 }, borderRadius: 3, bgcolor: "#ffffff", border: "1px dashed #cbd5e1", display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "center", alignItems: "center", gap: { xs: 0.5, sm: 1.5 } }}>
                              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Tasa de Cambio Aplicada:
                              </Typography>
                              <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 800, fontSize: { xs: "1rem", sm: "0.875rem" } }}>
                                {extractedData.tasaDeCambio}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Grid>

                      {/* Detalles de Ítems */}
                      {extractedData.items && extractedData.items.length > 0 && (
                        <Grid item size={{ xs: 12 }}>
                          <Box sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 2.5 }}>
                              <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "#eff6ff", color: "#3b82f6", display: "flex", mr: 1.5 }}>
                                <ShoppingCartIcon fontSize="small" />
                              </Box>
                              <Typography variant="h6" sx={{ color: "#0f172a", fontWeight: 800 }}>Detalle de Ítems</Typography>
                            </Box>
                            
                            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #f1f5f9" }}>
                              <Table size="small">
                                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Descripción</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Cantidad</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Precio Unit.</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Total</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {extractedData.items.map((item, index) => (
                                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                      <TableCell component="th" scope="row" sx={{ color: "#334155" }}>
                                        {item.descripcion || "-"}
                                      </TableCell>
                                      <TableCell align="right" sx={{ color: "#334155" }}>{item.cantidad || "-"}</TableCell>
                                      <TableCell align="right" sx={{ color: "#334155" }}>{item.precioUnitario || "-"}</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 600, color: "#0f172a" }}>{item.precioTotal || "-"}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        </Grid>
                      )}

                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
}