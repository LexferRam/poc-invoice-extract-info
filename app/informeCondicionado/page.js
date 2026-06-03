'use client';
import React from 'react';
import { Box } from '@mui/material';
import ChatWidget from './_components/ChatWidget'; // Asegúrate de que la ruta sea correcta

const App = () => {
  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc', // bg-slate-50
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // p-4 en móviles (32px), md:p-8 en pantallas medianas o mayores (64px)
      padding: { xs: '16px', md: '32px' } 
    }}>
      <ChatWidget />
    </Box>
  );
};

export default App;