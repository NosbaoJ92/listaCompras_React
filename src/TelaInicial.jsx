import React, { useState } from 'react';

const TelaInicial = ({ onSelectOption }) => {
  const [option, setOption] = useState('');
  const [subOption, setSubOption] = useState('');

  const handleMainOptionChange = (e) => {
    setOption(e.target.value);
    setSubOption('');
  };

  const handleSubOptionChange = (e) => {
    setSubOption(e.target.value);
  };

  return (
    <div className="container mx-auto p-4 h-full flex flex-col justify-center items-center">
      <h1 className="text-2xl font-bold mb-4">Lista de Compras</h1>
      <div className="mb-4">
        <label className="block mb-2">
          <input
            type="radio"
            value="somar"
            checked={option === 'somar'}
            onChange={handleMainOptionChange}
            className="mr-2"
          />
          Somar valores
        </label>
        <label className="block">
          <input
            type="radio"
            value="estipular"
            checked={option === 'estipular'}
            onChange={handleMainOptionChange}
            className="mr-2"
          />
          Estipular valor
        </label>
      </div>

      {option === 'estipular' && (
        <div className="mb-4">
          <label className="block mb-2">
            <input
              type="radio"
              value="subtrair"
              checked={subOption === 'subtrair'}
              onChange={handleSubOptionChange}
              className="mr-2"
            />
            Subtrair de um valor pré-definido
          </label>
          <label className="block">
            <input
              type="radio"
              value="maximo"
              checked={subOption === 'maximo'}
              onChange={handleSubOptionChange}
              className="mr-2"
            />
            Estipular valor máximo de gasto
          </label>
        </div>
      )}

      <button
        onClick={() => onSelectOption(option, subOption)}
        className="bg-blue-500 text-white rounded-lg p-2 hover:bg-blue-600"
      >
        Confirmar
      </button>
    </div>
  );
};

export default TelaInicial;
