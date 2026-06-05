import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  InputBase, 
  Avatar, 
  Paper,
  keyframes
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { GeminiService } from '../services/geminiService';
import { INITIAL_MESSAGE, MessageRole } from '../constants';
import MessageBubble from './MessageBubble';
import imageCompression from 'browser-image-compression';
import { styled } from '@mui/material/styles';

// Animaciones personalizadas
const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
`;

const bounceAnimation = keyframes`
  0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
  50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
`;

const PulseDot = styled('span')({
  width: '10px',
  height: '10px',
  backgroundColor: '#4ade80',
  borderRadius: '50%',
  animation: `${pulseAnimation} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
});

const BounceDot = styled('span')(({ delay }) => ({
  width: '6px',
  height: '6px',
  backgroundColor: '#94a3b8',
  borderRadius: '50%',
  animation: `${bounceAnimation} 1s infinite`,
  animationDelay: delay || '0s',
}));

const AssistantAvatar = () => (
  <Avatar 
    alt="Asistente Virtual" 
    src="/images/pimy.png" 
    sx={{ 
      width: 82, 
      height: 82, 
      border: '3px solid #fac960', 
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
      objectFit: 'cover'
    }}
  />
);

const ChatWidget = () => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: MessageRole.ASSISTANT,
      content: INITIAL_MESSAGE,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  
  const scrollRef = useRef(null);
  const geminiService = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    geminiService.current = new GeminiService();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, attachedImage]);

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        try {
          const options = {
            maxSizeMB: 0.25,
            maxWidthOrHeight: 1024,
            useWebWorker: true,
            initialQuality: 0.8,
          };
          const compressedFile = await imageCompression(file, options);
          const reader = new FileReader();
          reader.onloadend = () => {
            setAttachedImage(reader.result);
          };
          reader.readAsDataURL(compressedFile);
        } catch (error) {
          console.error("Error al comprimir la imagen:", error);
        }
      } else {
        const fileSizeMB = file.size / 1024 / 1024;
        if (fileSizeMB > 2.5) {
          alert("El archivo PDF es demasiado grande. Por favor, sube un documento menor a 2.5 MB para no exceder los límites del servidor.");
          return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachedImage(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setShowCamera(false);
      alert("No se pudo acceder a la cámara.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        canvasRef.current.toBlob(async (blob) => {
          if (blob) {
            try {
              const options = { 
                maxSizeMB: 0.25, 
                maxWidthOrHeight: 1024, 
                useWebWorker: true,
                initialQuality: 0.8 
              };
              const compressedFile = await imageCompression(blob, options);
              const reader = new FileReader();
              reader.onloadend = () => {
                setAttachedImage(reader.result);
                stopCamera();
              };
              reader.readAsDataURL(compressedFile);
            } catch (error) {
              console.error("Error comprimiendo foto:", error);
            }
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && !attachedImage) || isTyping || !geminiService.current) return;

    const currentImage = attachedImage;
    const userMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: inputValue || "Analiza esta imagen por favor.",
      image: currentImage || undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setAttachedImage(null);
    setIsTyping(true);

    const history = messages.map(msg => {
      const parts = [{ text: msg.content }];
      return {
        role: msg.role === MessageRole.USER ? 'user' : 'model',
        parts
      };
    });

    const responseText = await geminiService.current.sendMessage(
      userMessage.content, 
      history, 
      currentImage || undefined
    );

    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: MessageRole.ASSISTANT,
      content: responseText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  return (
    <Box sx={{
      // Ajustes responsivos clave:
      width: '100vw',                            // 100% del ancho de la pantalla móvil
      maxWidth: { xs: '100%', sm: '896px' },     // En pantallas chicas es 100%, en desktop max-w-4xl
      height: { xs: '100vh', sm: '85vh' },       // Ocupa el 100% del alto disponible en móvil
      borderRadius: { xs: '0px', sm: '24px' },   // Sin bordes redondeados en móvil para verse nativo
      boxShadow: { 
        xs: 'none', 
        sm: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
      },
      border: { xs: 'none', sm: '1px solid #e2e8f0' },
      
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{
        backgroundColor: '#d45314', 
        padding: '20px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'between',
        color: '#ffffff'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <AssistantAvatar />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.125rem', lineHeight: '1.75rem' }}>
              Análisis de informe médico
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PulseDot />
              <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.9, textTransform: 'uppercase', fontWeight: 600 }}>
                Asistente Virtual Activa
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box 
        ref={scrollRef} 
        sx={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px', 
          backgroundColor: '#f8fafc', 
          display: 'flex',
          flexDirection: 'column',
          gap: '8px', 
          position: 'relative'
        }}
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        
        {isTyping && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Box sx={{
              backgroundColor: '#ffffff',
              padding: '12px 16px',
              borderRadius: '16px',
              borderBottomLeftRadius: 0,
              border: '1px solid #f1f5f9',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              display: 'flex',
              gap: '4px'
            }}>
              <BounceDot delay="-0.3s" />
              <BounceDot delay="-0.15s" />
              <BounceDot />
            </Box>
          </Box>
        )}

        {/* Camera Overlay */}
        {showCamera && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            backgroundColor: '#000000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <Box 
              component="video" 
              ref={videoRef} 
              autoPlay 
              playsInline 
              sx={{ width: '100%', height: 'auto', borderRadius: '12px', backgroundColor: '#1e293b' }} 
            />
            <Box sx={{ display: 'flex', gap: '16px', mt: 3 }}>
              <IconButton onClick={stopCamera} sx={{ width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' } }}>
                <CloseIcon />
              </IconButton>
              <IconButton onClick={capturePhoto} sx={{ width: 64, height: 64, backgroundColor: '#ffffff', border: '4px solid rgba(255,255,255,0.3)', '&:hover': { backgroundColor: '#f1f5f9' } }}>
                <Box sx={{ width: 48, height: 48, backgroundColor: '#2563eb', borderRadius: '50%' }} />
              </IconButton>
            </Box>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </Box>
        )}
      </Box>

      {/* Input Area */}
      <Box sx={{ padding: '16px', backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
        {attachedImage && (
          <Box sx={{ mb: 1.5, position: 'relative', display: 'inline-block' }}>
            {attachedImage.startsWith('data:application/pdf') ? (
              <Box sx={{
                width: 80,
                height: 80,
                borderRadius: '12px',
                border: '2px solid #dbeafe',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                backgroundColor: '#eff6ff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6'
              }}>
                <DescriptionIcon sx={{ fontSize: 32 }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold', mt: 0.5 }}>PDF</Typography>
              </Box>
            ) : (
              <Box 
                component="img" 
                src={attachedImage} 
                alt="Preview" 
                sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '12px', border: '2px solid #dbeafe', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
              />
            )}
            <IconButton 
              onClick={() => setAttachedImage(null)}
              size="small"
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                backgroundColor: '#ef4444',
                color: '#ffffff',
                padding: '4px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                '&:hover': { backgroundColor: '#dc2626' }
              }}
            >
              <CloseIcon sx={{ fontSize: 12 }} />
            </IconButton>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="image/*,application/pdf" 
            onChange={handleImageSelect}
          />
          
          <IconButton 
            onClick={() => fileInputRef.current?.click()}
            title="Adjuntar imagen"
            sx={{ color: '#94a3b8', '&:hover': { color: '#2563eb', backgroundColor: '#eff6ff' }, transition: 'all 0.2s' }}
          >
            <AttachFileIcon />
          </IconButton>

          <IconButton 
            onClick={startCamera}
            title="Tomar foto"
            sx={{ color: '#94a3b8', '&:hover': { color: '#2563eb', backgroundColor: '#eff6ff' }, transition: 'all 0.2s' }}
          >
            <PhotoCameraIcon />
          </IconButton>

          <Box sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f1f5f9',
            borderRadius: '16px',
            px: 2,
            py: 0.5,
            '&:focus-within': { ring: '2px solid #dbeafe' }
          }}>
            <InputBase
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Explícame qué necesitas o sube tu informe..."
              fullWidth
              sx={{ fontSize: '1rem', color: '#334155' }}
            />
            <IconButton
              onClick={handleSend}
              disabled={(!inputValue.trim() && !attachedImage) || isTyping}
              sx={{
                p: '10px',
                borderRadius: '12px',
                transition: 'all 0.2s',
                backgroundColor: (inputValue.trim() || attachedImage) && !isTyping ? '#f1a10d' : '#cbd5e1',
                color: (inputValue.trim() || attachedImage) && !isTyping ? '#ffffff' : '#f8fafc',
                boxShadow: (inputValue.trim() || attachedImage) && !isTyping ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                '&:hover': {
                  backgroundColor: (inputValue.trim() || attachedImage) && !isTyping ? '#f1a10d' : '#cbd5e1',
                },
                '&.Mui-disabled': {
                  backgroundColor: '#cbd5e1',
                  color: '#f8fafc'
                }
              }}
            >
              <SendIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatWidget;