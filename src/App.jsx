import React, { useState } from 'react';
import TelaInicial from './TelaInicial';
import AdicionarProduto from './AdicionarProduto';
import ValorDefinido from './ValorDefinido';
import ValorMaximo from './ValorMaximo';

const App = () => {
  const [option, setOption] = useState('');
  const [subOption, setSubOption] = useState('');

  const handleSelectOption = (selectedOption, selectedSubOption) => {
    setOption(selectedOption);
    setSubOption(selectedSubOption);
  };

  return (
    <div className="h-dvh w-dvw p-4">
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

export default App;
