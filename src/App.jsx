import React, { useState } from 'react';
import TelaInicial from './TelaInicial';
import AdicionarProduto from './AdicionarProduto';
import ValorDefinido from './ValorDefinido';
import ValorMaximo from './ValorMaximo';
import { ThemeProvider, useTheme } from './ThemeContext';


const AppContent = () => {
  const [option, setOption] = useState('');
  const [subOption, setSubOption] = useState('');
  const { modoNoturno, toggleModoNoturno } = useTheme();

  const handleSelectOption = (selectedOption, selectedSubOption) => {
    setOption(selectedOption);
    setSubOption(selectedSubOption);
  };

  const handleGoHome = () => {
    setOption('');
    setSubOption(''); // Resetar subOption também para garantir
  };

  return (
    <div className={`h-dvh w-dvw  relative ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>

      {option === '' && (
        <TelaInicial onSelectOption={handleSelectOption} />
      )}

      {option === 'somar' && (
        <AdicionarProduto  onGoHome={handleGoHome}/>
      )}

      {option === 'estipular' && subOption === 'subtrair' && (
        <ValorDefinido  onGoHome={handleGoHome} />
      )}

      {option === 'estipular' && subOption === 'maximo' && (
        <ValorMaximo  onGoHome={handleGoHome} />
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
