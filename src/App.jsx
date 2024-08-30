import React, { useState } from 'react';
import TelaInicial from './TelaInicial';
import AdicionarProduto from './AdicionarProduto';
import ValorDefinido from './ValorDefinido';
import ValorMaximo from './ValorMaximo';
import { ThemeProvider, useTheme } from './ThemeContext';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'; // Certifique-se de instalar @heroicons/react


const AppContent = () => {
  const [option, setOption] = useState('');
  const [subOption, setSubOption] = useState('');
  const { modoNoturno, toggleModoNoturno } = useTheme();

  const handleSelectOption = (selectedOption, selectedSubOption) => {
    setOption(selectedOption);
    setSubOption(selectedSubOption);
  };

  return (
    <div className={`h-dvh w-dvw overflow-auto relative ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      <div className="flex absolute right-0 p-4">
        {/* <button
          onClick={toggleModoNoturno}
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          {modoNoturno ? 'Modo Claro' : 'Modo Escuro'}
        </button> */}

        <button
          onClick={toggleModoNoturno}
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          {modoNoturno ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-gray-600" />}
        </button>
      </div>

      {option === '' && (
        <TelaInicial onSelectOption={handleSelectOption} />
      )}

      {option === 'somar' && (
        <AdicionarProduto />
      )}

      {option === 'estipular' && subOption === 'subtrair' && (
        <ValorDefinido />
      )}

      {option === 'estipular' && subOption === 'maximo' && (
        <ValorMaximo />
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
