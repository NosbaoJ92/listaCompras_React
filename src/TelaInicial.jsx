import React from 'react';
import { useTheme } from './ThemeContext';

const TelaInicial = ({ onSelectOption }) => {
  const [option, setOption] = React.useState('');
  const [subOption, setSubOption] = React.useState('');
  const { modoNoturno, toggleModoNoturno } = useTheme();

  const handleMainOptionChange = (e) => {
    setOption(e.target.value);
    setSubOption(''); // Limpa subopção ao mudar a opção principal
  };

  const handleSubOptionChange = (e) => {
    setSubOption(e.target.value);
  };

  const handleConfirm = () => {
    if (option === 'estipular' && !subOption) {
      alert('Por favor, selecione uma subopção para "Estipular valor".');
      return;
    }
    onSelectOption(option, subOption);
  };

  return (
    <div className={`h-full w-screen flex flex-col justify-center items-center ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      <h1 className="text-2xl font-bold">Lista de Compras</h1>
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
        onClick={handleConfirm}
        className="bg-blue-500 text-white rounded-lg p-2 hover:bg-blue-600"
      >
        Confirmar
      </button>
    </div>
  );
};

export default TelaInicial;
