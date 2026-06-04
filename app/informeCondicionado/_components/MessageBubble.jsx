"use client";
import { Box, Typography } from '@mui/material';
import { Description as DescriptionIcon } from '@mui/icons-material';
import { MessageRole } from '../constants'; // Asumiendo MessageRole migrado aquí

const MessageBubble = ({ message }) => {
  const isUser = message.role === MessageRole.USER;

  return (
    <Box sx={{
      display: 'flex',
      width: '100%',
      mb: 2, // mb-4 (8px * 2)
      justifyContent: isUser ? 'flex-end' : 'flex-start'
    }}>
      <Box sx={{
        maxWidth: '85%',
        borderRadius: '16px', // rounded-2xl
        fontSize: '0.875rem', // text-sm
        lineHeight: 1.625, // leading-relaxed
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // shadow-sm
        overflow: 'hidden',
        // Cambios condicionales de diseño según el rol
        backgroundColor: isUser ? '#7f7f7e' : '#ffffff', // bg-blue-600 : bg-white
        color: isUser ? '#ffffff' : '#1e293b', // text-white : text-slate-800
        borderBottomRightRadius: isUser ? 0 : '16px', // rounded-br-none
        borderBottomLeftRadius: isUser ? '16px' : 0, // rounded-bl-none
        border: isUser ? 'none' : '1px solid #f1f5f9' // border-slate-100
      }}>
        {/* Renderizado condicional de Adjuntos (Imagen o PDF) */}
        {message.image && (
          <Box sx={{ width: '100%' }}>
            {message.image.startsWith('data:application/pdf') ? (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3, // p-6 (8px * 3)
                backgroundColor: '#f1f5f9', // bg-slate-100
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#64748b' // text-slate-500
              }}>
                <DescriptionIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Documento PDF Adjunto
                </Typography>
              </Box>
            ) : (
              <Box
                component="img"
                src={message.image}
                alt="Adjunto"
                sx={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '240px', // max-h-60
                  objectFit: 'cover',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              />
            )}
          </Box>
        )}

        {/* Contenido de texto del mensaje */}
        <Box sx={{ px: 2, py: 1.5 }}> {/* px-4, py-3 */}
          <Typography 
            component="div"
            sx={{ 
              whiteSpace: 'pre-wrap',
              fontSize: 'inherit',
              lineHeight: 'inherit'
            }}
          >
            {(message.content || '').split('\n').map((line, lineIndex, array) => {
              const isHeading = line.trim().startsWith('###');
              const textContent = isHeading ? line.replace(/^\s*###\s*/, '') : line;
              
              const formattedLine = textContent.split(/\*\*(.*?)\*\*/g).map((part, index) => 
                index % 2 !== 0 ? <strong key={index}>{part}</strong> : part
              );

              if (isHeading) {
                return (
                  <Typography key={lineIndex} component="h3" sx={{ fontWeight: 'bold', fontSize: '1.125rem', mt: lineIndex === 0 ? 0 : 1.5, mb: 0.5 }}>
                    {formattedLine}
                  </Typography>
                );
              }

              return (
                <span key={lineIndex}>
                  {formattedLine}
                  {lineIndex < array.length - 1 ? '\n' : ''}
                </span>
              );
            })}
          </Typography>
          
          <Box sx={{
            fontSize: '10px',
            mt: 0.5, // mt-1
            opacity: 0.7,
            textAlign: isUser ? 'right' : 'left',
            color: isUser ? '#dbeafe' : '#94a3b8' // text-blue-100 : text-slate-400
          }}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MessageBubble;