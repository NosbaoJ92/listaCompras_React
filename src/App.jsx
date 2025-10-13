import React, { useState } from 'react';
import TelaInicial from './TelaInicial';
import SomarValor from './SomarValor';
import ValorDefinido from './ValorDefinido';
import ValorMaximo from './ValorMaximo';
import { ThemeProvider, useTheme } from './ThemeContext';


const AppContent = () => {
  const [option, setOption] = useState('');
  const [subOption, setSubOption] = useState('');
  const { modoNoturno, toggleModoNoturno } = useTheme(); // Obtenção do Contexto

  const handleSelectOption = (selectedOption, selectedSubOption) => {
    setOption(selectedOption);
    setSubOption(selectedSubOption);
  };

  const handleGoHome = () => {
    setOption('');
    setSubOption(''); // Resetar subOption também para garantir
  };

  return (
    // Aplica o tema na div principal (garantindo o fundo de toda a tela)
    <div className={`h-dvh w-dvw relative transition-colors duration-500 ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}> 
      
      {/* Botão de tema sempre visível se a lógica for global (opcional) */}
      {/* Você pode querer mover esse botão para dentro de TelaInicial para não cobrir a tela inteira */}

      {option === '' && (
        // Se TelaInicial tiver um botão de tema, passe as props:
        <TelaInicial 
            onSelectOption={handleSelectOption} 
            modoNoturno={modoNoturno} 
            onToggleModoNoturno={toggleModoNoturno}
        />
      )}

      {option === 'somar' && (
        <SomarValor 
            onGoHome={handleGoHome}
            modoNoturno={modoNoturno} 
            onToggleModoNoturno={toggleModoNoturno}
        />
      )}

      {option === 'estipular' && subOption === 'subtrair' && (
        // PASSANDO AS PROPS DE TEMA PARA O VALORDEFINIDO
        <ValorDefinido 
            onGoHome={handleGoHome} 
            modoNoturno={modoNoturno} 
            onToggleModoNoturno={toggleModoNoturno}
        />
      )}

      {option === 'estipular' && subOption === 'maximo' && (
        <ValorMaximo 
            onGoHome={handleGoHome}
            modoNoturno={modoNoturno} 
            onToggleModoNoturno={toggleModoNoturno}
        />
      )}
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;