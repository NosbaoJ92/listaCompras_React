import React, { useState } from 'react';
import TelaInicial from './TelaInicial';
import AdicionarProduto from './AdicionarProduto';

const App = () => {
  const [option, setOption] = useState('');
  const [subOption, setSubOption] = useState('');

  const handleSelectOption = (option, subOption) => {
    setOption(option);
    setSubOption(subOption);
  };

  return (
    <div className="min-h-dvh p-4">
      {option === '' && (
        <TelaInicial onSelectOption={handleSelectOption} />
      )}

      {option === 'somar' && (
        <AdicionarProduto />
      )}

      {/* Outras opções e telas podem ser adicionadas aqui */}
    </div>
  );
};

export default App;
