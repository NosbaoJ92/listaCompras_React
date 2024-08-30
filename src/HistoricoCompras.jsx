import React from 'react';

const HistoricoCompras = ({ historico }) => {
  return (
    <div>
      <h2>Histórico de Compras</h2>
      <ul>
        {historico.map((compra, index) => (
          <li key={index}>{compra}</li>
        ))}
      </ul>
    </div>
  );
};

export default HistoricoCompras;
