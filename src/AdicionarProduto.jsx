import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AdicionarProduto = () => {
  const [produtos, setProdutos] = useState([]);
  const [nomeProduto, setNomeProduto] = useState('');
  const [valorProduto, setValorProduto] = useState('');
  const [quantidadeProduto, setQuantidadeProduto] = useState('');
  const [erro, setErro] = useState('');
  const [editandoIndex, setEditandoIndex] = useState(null);

  const handleAddProduto = () => {
    if (!nomeProduto || !valorProduto || !quantidadeProduto) {
      setErro('Por favor, preencha todos os campos.');
      setTimeout(() => {
        setErro('');
      }, 3000);
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
    doc.text("Relatório de gestão de compras", 10, 10);

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
    doc.text(`Total da Compra: R$ ${totalCompra}`, 10, doc.lastAutoTable.finalY + 10);

    doc.save('lista-produtos.pdf');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">Adicionar Produtos</h1>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Nome do Produto"
            value={nomeProduto}
            onChange={(e) => setNomeProduto(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border border-gray-300 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Valor"
            value={valorProduto}
            onChange={(e) => setValorProduto(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border border-gray-300 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Quantidade"
            value={quantidadeProduto}
            onChange={(e) => setQuantidadeProduto(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border border-gray-300 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddProduto}
            className="bg-blue-600 text-white rounded-md p-3 hover:bg-blue-700 col-span-1 sm:col-span-3"
          >
            {editandoIndex !== null ? 'Atualizar Produto' : 'Adicionar Produto'}
          </button>
        </div>

        {erro && (
          <p className="text-red-500 mb-4">{erro}</p>
        )}
      </div>

      <div className="overflow-x-auto mb-6 bg-white p-4 rounded-lg shadow-md">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="px-4 py-2 border-b">Nome</th>
              <th className="px-4 py-2 border-b">Valor Unitário</th>
              <th className="px-4 py-2 border-b">Quantidade</th>
              <th className="px-4 py-2 border-b">Total</th>
              <th className="px-4 py-2 border-b">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((produto, index) => (
              <tr key={index} className="text-gray-700">
                <td className="px-4 py-2 border-b">{produto.nome}</td>
                <td className="px-4 py-2 border-b">R$ {produto.valor.toFixed(2)}</td>
                <td className="px-4 py-2 border-b">{produto.quantidade}</td>
                <td className="px-4 py-2 border-b">R$ {produto.total.toFixed(2)}</td>
                <td className="px-4 py-2 border-b flex gap-2 justify-center">
                  <button 
                    onClick={() => handleEditProduto(index)} 
                    className="bg-yellow-500 text-white rounded-md p-2 hover:bg-yellow-600"
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
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800">
          Total da Compra: <span className="text-green-600">R$ {calcularTotalCompra().toFixed(2)}</span>
        </h2>
        <button 
          onClick={gerarPDF} 
          className="bg-green-600 text-white rounded-md p-3 hover:bg-green-700"
        >
          Gerar PDF
        </button>
      </div>
    </div>
  );
};

export default AdicionarProduto;
