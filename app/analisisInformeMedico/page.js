"use client";

import React, { useState, useRef, useEffect } from "react";
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
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import PersonIcon from "@mui/icons-material/Person";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import HealingIcon from "@mui/icons-material/Healing";
import EventNoteIcon from "@mui/icons-material/EventNote";
import NoteAltIcon from "@mui/icons-material/NoteAlt";

export default function AnalizarInformeMedicoPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [base64Data, setBase64Data] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    if (extractedData && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [extractedData]);

  const processFile = (selectedFile) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    setExtractedData(null);
    setError(null);

    setPreviewUrl(URL.createObjectURL(selectedFile));

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setBase64Data(base64);
      handleAnalyze(base64);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
  };

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
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setBase64Data("");
    setExtractedData(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async (base64Param) => {
    const dataToSend = typeof base64Param === "string" ? base64Param : base64Data;
    if (!dataToSend) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analisisInforme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataToSend }),
      });

      const result = await response.json();

      if (result.success) {
        setExtractedData(result.data);
      } else {
        setError(result.error || "Ocurrió un error al analizar el informe médico.");
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
            Análisis de Informes Médicos
          </Typography>
          <Typography variant="body1" sx={{ color: "#64748b" }}>
            Sube un informe médico, récipe o historia clínica para extraer sus datos automáticamente.
          </Typography>
        </Box>

        {/* Tarjeta de Carga */}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, mb: 5, boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)", backgroundColor: "#ffffff" }}>
          {!file ? (
            <Box
              onClick={() => fileInputRef.current.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                border: isDragging ? "2px dashed #0284c7" : "2px dashed #cbd5e1",
                borderRadius: 4,
                p: { xs: 4, md: 8 },
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: isDragging ? "#f0f9ff" : "#ffffff",
                transition: "all 0.2s ease-in-out",
                "&:hover": { backgroundColor: "#f8fafc", borderColor: "#94a3b8" },
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 64, color: isDragging ? "#0284c7" : "#0ea5e9", mb: 2 }} />
              <Typography variant="h6" sx={{ color: "#1e293b", fontWeight: 700, mb: 1 }}>
                {isDragging ? "Suelta el documento aquí" : "Arrastra y suelta tu informe médico"}
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
                    style={{ width: "100%", height: "500px", borderRadius: "16px", border: "1px solid #e2e8f0" }}
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Previsualización"
                    style={{ maxWidth: "100%", maxHeight: "500px", borderRadius: "16px", objectFit: "contain" }}
                  />
                )}
                <IconButton
                  onClick={handleClearFile}
                  sx={{ position: "absolute", top: -16, right: -16, bgcolor: "#ffffff", color: "#ef4444", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", "&:hover": { bgcolor: "#fef2f2" } }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              
              {!extractedData && (
                <Box sx={{ mt: 4 }}>
                  <Button
                    variant="contained"
                    onClick={handleAnalyze}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <MedicalServicesIcon />}
                    sx={{ py: 1.5, px: 5, borderRadius: 8, fontWeight: 700, textTransform: "none", fontSize: "1.05rem", bgcolor: "#0ea5e9", "&:hover": { bgcolor: "#0284c7" } }}
                  >
                    {loading ? "Analizando Documento..." : "Reintentar Extracción"}
                  </Button>
                </Box>
              )}
            </Box>
          )}
          <input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
        </Paper>

        {error && (
          <Paper elevation={0} sx={{ p: 2.5, bgcolor: "#fef2f2", color: "#dc2626", borderRadius: 3, mb: 4, display: "flex", alignItems: "center", border: "1px solid #fecaca" }}>
            <ErrorIcon sx={{ mr: 1 }} />
            <Typography sx={{ fontWeight: 500 }}>{error}</Typography>
          </Paper>
        )}

        {extractedData && (
          <Box ref={resultsRef} sx={{ animation: "fadeIn 0.5s ease-in-out", scrollMarginTop: "24px" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>Resultados Extraídos</Typography>
              <Chip icon={<CheckCircleIcon />} label="Informe Válido" color="success" sx={{ fontWeight: 700, borderRadius: 2, px: 1 }} />
            </Box>

            <Grid container spacing={3}>
              {/* Datos del Paciente */}
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ height: "100%", borderRadius: 4, border: "1px solid #e0f2fe", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                      <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#f0f9ff", color: "#0ea5e9", display: "flex", mr: 2 }}><PersonIcon /></Box>
                      <Typography variant="h6" sx={{ color: "#0f172a", fontWeight: 700 }}>Datos del Paciente</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}><Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>NOMBRE COMPLETO</Typography><Typography variant="body1" sx={{ fontWeight: 600, color: "#334155" }}>{extractedData.nombrePaciente || "No especificado"}</Typography></Box>
                    <Box><Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>EDAD / FECHA DE NACIMIENTO</Typography><Typography variant="body1" sx={{ fontWeight: 600, color: "#334155" }}>{extractedData.edadPaciente || "No especificada"}</Typography></Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Datos del Médico y Consulta */}
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ height: "100%", borderRadius: 4, border: "1px solid #e0f2fe", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                      <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#ecfdf5", color: "#10b981", display: "flex", mr: 2 }}><MedicalServicesIcon /></Box>
                      <Typography variant="h6" sx={{ color: "#0f172a", fontWeight: 700 }}>Médico y Consulta</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}><Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>MÉDICO TRATANTE</Typography><Typography variant="body1" sx={{ fontWeight: 600, color: "#334155" }}>{extractedData.nombreMedico || "No especificado"}</Typography></Box>
                    <Box sx={{ display: "flex", gap: 3 }}>
                      <Box><Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>FECHA INFORME</Typography><Typography variant="body1" sx={{ fontWeight: 600, color: "#334155" }}>{extractedData.fechaInforme || "N/A"}</Typography></Box>
                      <Box><Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>FECHA CONSULTA</Typography><Typography variant="body1" sx={{ fontWeight: 600, color: "#334155" }}>{extractedData.fechaConsulta || "N/A"}</Typography></Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Detalles Médicos (Diagnóstico y Tratamiento) */}
              <Grid item xs={12}>
                <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Grid container spacing={4}>
                      <Grid item xs={12}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                          <LocalHospitalIcon sx={{ color: "#f43f5e", mr: 1.5, mt: 0.2 }} />
                          <Box><Typography variant="subtitle2" sx={{ color: "#f43f5e", fontWeight: 800 }}>DIAGNÓSTICO / PATOLOGÍA</Typography><Typography variant="body1" sx={{ mt: 0.5, color: "#1e293b", lineHeight: 1.6 }}>{extractedData.patologia || "No se detectó un diagnóstico explícito."}</Typography></Box>
                        </Box>
                        <Divider sx={{ my: 2.5 }} />
                        <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                          <HealingIcon sx={{ color: "#0ea5e9", mr: 1.5, mt: 0.2 }} />
                          <Box><Typography variant="subtitle2" sx={{ color: "#0ea5e9", fontWeight: 800 }}>TRATAMIENTO INDICADO</Typography><Typography variant="body1" sx={{ mt: 0.5, color: "#1e293b", lineHeight: 1.6 }}>{extractedData.tratamiento || "No se detectó un tratamiento explícito."}</Typography></Box>
                        </Box>
                        <Divider sx={{ my: 2.5 }} />
                        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                          <NoteAltIcon sx={{ color: "#8b5cf6", mr: 1.5, mt: 0.2 }} />
                          <Box><Typography variant="subtitle2" sx={{ color: "#8b5cf6", fontWeight: 800 }}>OBSERVACIONES ADICIONALES</Typography><Typography variant="body1" sx={{ mt: 0.5, color: "#1e293b", lineHeight: 1.6 }}>{extractedData.observaciones || "Sin observaciones adicionales."}</Typography></Box>
                        </Box>
                      </Grid>
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
