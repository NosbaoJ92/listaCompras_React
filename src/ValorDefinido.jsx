import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ValorDefinido = () => {
  const [produtos, setProdutos] = useState([]);
  const [nomeProduto, setNomeProduto] = useState('');
  const [valorProduto, setValorProduto] = useState('');
  const [quantidadeProduto, setQuantidadeProduto] = useState('');
  const [valorPreDefinido, setValorPreDefinido] = useState('');
  const [erro, setErro] = useState('');
  const [editandoIndex, setEditandoIndex] = useState(null);

  const handleAddProduto = () => {
    if (!nomeProduto || !valorProduto || !quantidadeProduto) {
      setErro('Por favor, preencha todos os campos.');
      setTimeout(() => setErro(''), 3000);
      return;
    }

    const novoProduto = {
      nome: nomeProduto,
      valor: parseFloat(valorProduto),
      quantidade: parseInt(quantidadeProduto),
      total: parseFloat(valorProduto) * parseInt(quantidadeProduto),
    };

    if (editandoIndex !== null) {
      const produtosAtualizados = produtos.map((produto, index) =>
        index === editandoIndex ? novoProduto : produto
      );
      setProdutos(produtosAtualizados);
      setEditandoIndex(null);
    } else {
      setProdutos([...produtos, novoProduto]);
    }

    setNomeProduto('');
    setValorProduto('');
    setQuantidadeProduto('');
    setErro('');
  };

  const handleEditProduto = (index) => {
    const produto = produtos[index];
    setNomeProduto(produto.nome);
    setValorProduto(produto.valor.toString());
    setQuantidadeProduto(produto.quantidade.toString());
    setEditandoIndex(index);
  };

  const handleDeleteProduto = (index) => {
    const produtosAtualizados = produtos.filter((_, i) => i !== index);
    setProdutos(produtosAtualizados);
  };

  const calcularTotalCompra = () => {
    return produtos.reduce((acc, produto) => acc + produto.total, 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddProduto();
    }
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Subtração de Valor Pré-Definido", 10, 10);

    const tableColumn = ["Nome", "Valor Unitário", "Quantidade", "Total"];
    const tableRows = produtos.map((produto) => [
      produto.nome,
      `R$ ${produto.valor.toFixed(2)}`,
      produto.quantidade,
      `R$ ${produto.total.toFixed(2)}`
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20
    });

    const totalCompra = calcularTotalCompra().toFixed(2);
    const valorRestante = (valorPreDefinido - totalCompra).toFixed(2);
    doc.text(`Total da Compra: R$ ${totalCompra}`, 10, doc.lastAutoTable.finalY + 10);
    doc.text(`Valor Restante: R$ ${valorRestante}`, 10, doc.lastAutoTable.finalY + 20);

    doc.save('valor-predefinido.pdf');
  };

  return (
    <div className="container mx-auto h-screen w-screen p-4 border">
      <h1 className="text-2xl font-bold mb-4">Subtrair de Valor Pré-Definido</h1>
      <div className="mb-4">
        <label className="block mb-2">Valor Pré-Definido (R$)</label>
        <input
          type="number"
          placeholder="Ex: 100.00"
          value={valorPreDefinido}
          onChange={(e) => setValorPreDefinido(e.target.value)}
          className="border rounded-md p-2 w-full text-black"
        />
      </div>

      <div className="flex gap-4 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Nome do Produto"
          value={nomeProduto}
          onChange={(e) => setNomeProduto(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border rounded-md p-2 w-1/4 text-black"
        />
        <input
          type="number"
          placeholder="Valor"
          value={valorProduto}
          onChange={(e) => setValorProduto(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border rounded-md p-2 w-1/4 text-black"
        />
        <input
          type="number"
          placeholder="Quantidade"
          value={quantidadeProduto}
          onChange={(e) => setQuantidadeProduto(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border rounded-md p-2 w-1/4 text-black"
        />
        <button
          onClick={handleAddProduto}
          className="bg-blue-500 text-white rounded-md p-2 hover:bg-blue-600"
        >
          {editandoIndex !== null ? 'Atualizar Produto' : 'Adicionar Produto'}
        </button>
      </div>

      {erro && (
        <p className="text-red-500 mb-4">{erro}</p>
      )}

      <table className="w-full table-auto mb-4">
        <thead>
          <tr className="bg-gray-400">
            <th className="px-4 py-2 border-2 border-black text-black">Nome</th>
            <th className="px-4 py-2 border-2 border-black text-black">Valor Unitário</th>
            <th className="px-4 py-2 border-2 border-black text-black">Quantidade</th>
            <th className="px-4 py-2 border-2 border-black text-black">Total</th>
            <th className="px-4 py-2 border-2 border-black text-black">Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((produto, index) => (
            <tr key={index} className="bg-white text-center border-b text-black">
              <td className="px-4 py-2 border-2 border-black">{produto.nome}</td>
              <td className="px-4 py-2 border-2 border-black">R$ {produto.valor.toFixed(2)}</td>
              <td className="px-4 py-2 border-2 border-black">{produto.quantidade}</td>
              <td className="px-4 py-2 border-2 border-black">R$ {produto.total.toFixed(2)}</td>
              <td className="px-4 py-2 border-2 border-black">
                <button 
                  onClick={() => handleEditProduto(index)} 
                  className="bg-yellow-500 text-white rounded-md p-2 hover:bg-yellow-600 mr-2"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteProduto(index)}
                  className="bg-red-500 text-white rounded-md p-2 hover:bg-red-600"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex w-full justify-between">
        <h2 className="text-xl font-bold mt-4">
          Total da Compra: <span className="text-green-500">R$ {calcularTotalCompra().toFixed(2)}</span>
        </h2>
        <button 
          onClick={gerarPDF} 
          className="bg-green-500 text-white rounded-md p-2 hover:bg-green-600 mt-4"
        >
          Gerar PDF
        </button>
      </div>
    </div>
  );
};

export default ValorDefinido;
