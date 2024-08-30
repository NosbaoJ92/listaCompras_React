import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ValorMaximo = () => {
  const [produtos, setProdutos] = useState([]);
  const [nomeProduto, setNomeProduto] = useState('');
  const [valorProduto, setValorProduto] = useState('');
  const [quantidadeProduto, setQuantidadeProduto] = useState('');
  const [valorMaximo, setValorMaximo] = useState('');
  const [valorMaximoConfirmado, setValorMaximoConfirmado] = useState(null);
  const [erro, setErro] = useState('');
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoTemp, setProdutoTemp] = useState(null);

  const valorMaximoNumerico = parseFloat(valorMaximo) || 0;
  const valorMaximoConfirmadoNumerico = parseFloat(valorMaximoConfirmado) || 0;

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

    const totalAtual = calcularTotalCompra() - (editandoIndex !== null ? produtos[editandoIndex].total : 0);
    const novoTotalCompra = totalAtual + novoProduto.total;

    if (valorMaximoConfirmadoNumerico > 0 && novoTotalCompra > valorMaximoConfirmadoNumerico) {
      setProdutoTemp(novoProduto);
      setModalAberto(true);
      return;
    }

    if (editandoIndex !== null) {
      const produtosAtualizados = produtos.map((produto, index) =>
        index === editandoIndex ? novoProduto : produto
      );
      setProdutos(produtosAtualizados);
      setEditandoIndex(null);
    } else {
      setProdutos([...produtos, novoProduto]);
    }

    resetarCampos();
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

  const handleIncrementarQuantidade = (index) => {
    const produtosAtualizados = produtos.map((produto, i) => {
      if (i === index) {
        return {
          ...produto,
          quantidade: produto.quantidade + 1,
          total: (produto.quantidade + 1) * produto.valor,
        };
      }
      return produto;
    });
    setProdutos(produtosAtualizados);
  };

  const handleDecrementarQuantidade = (index) => {
    const produtosAtualizados = produtos.map((produto, i) => {
      if (i === index && produto.quantidade > 1) {
        return {
          ...produto,
          quantidade: produto.quantidade - 1,
          total: (produto.quantidade - 1) * produto.valor,
        };
      }
      return produto;
    });
    setProdutos(produtosAtualizados);
  };

  const calcularTotalCompra = () => {
    return produtos.reduce((acc, produto) => acc + produto.total, 0);
  };

  const resetarCampos = () => {
    setNomeProduto('');
    setValorProduto('');
    setQuantidadeProduto('');
    setErro('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddProduto();
    }
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Estipulação de Valor Máximo", 10, 10);

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
    const valorExcedente = (totalCompra > valorMaximoConfirmadoNumerico ? (totalCompra - valorMaximoConfirmadoNumerico).toFixed(2) : '0.00');
    doc.text(`Total da Compra: R$ ${totalCompra}`, 10, doc.lastAutoTable.finalY + 10);
    doc.text(`Valor Máximo: R$ ${valorMaximoConfirmadoNumerico.toFixed(2)}`, 10, doc.lastAutoTable.finalY + 20);
    doc.text(`Valor Excedente: R$ ${valorExcedente}`, 10, doc.lastAutoTable.finalY + 30);

    doc.save('valor-maximo.pdf');
  };

  const handleModalConfirmar = () => {
    if (produtoTemp) {
      if (editandoIndex !== null) {
        const produtosAtualizados = produtos.map((produto, index) =>
          index === editandoIndex ? produtoTemp : produto
        );
        setProdutos(produtosAtualizados);
        setEditandoIndex(null);
      } else {
        setProdutos((produtos) => [...produtos, produtoTemp]);
      }
      setProdutoTemp(null);
    }
    setModalAberto(false);
    resetarCampos();
  };

  const handleModalRevisar = () => {
    setModalAberto(false);
    setProdutoTemp(null);
  };

  const confirmarValorMaximo = () => {
    setValorMaximoConfirmado(valorMaximo);
    setValorMaximo('');
  };

  return (
    <div className="container mx-auto p-4 h-screen w-screen">
      <h1 className="text-2xl font-bold mb-4">Estipular Valor Máximo de Gasto</h1>
      <div className="mb-4">
        <label className="block mb-2">Valor Máximo (R$)</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="number"
            placeholder="Ex: 100.00"
            value={valorMaximo}
            onChange={(e) => setValorMaximo(e.target.value)}
            className="border rounded-md p-2 flex-1 text-black"
          />
          <button
            onClick={confirmarValorMaximo}
            className="bg-green-500 text-white rounded-md p-2 hover:bg-green-600"
          >
            Confirmar Valor Máximo
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Nome do Produto"
          value={nomeProduto}
          onChange={(e) => setNomeProduto(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border rounded-md p-2 flex w-full text-black"
        />
        <input
          type="number"
          placeholder="Valor"
          value={valorProduto}
          onChange={(e) => setValorProduto(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border rounded-md p-2 flex-1 text-black"
        />
        <input
          type="number"
          placeholder="Quantidade"
          value={quantidadeProduto}
          onChange={(e) => setQuantidadeProduto(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border rounded-md p-2 flex-1 text-black"
        />
        <button
          onClick={handleAddProduto}
          className={`${
            editandoIndex !== null ? 'bg-yellow-500' : 'bg-blue-500'
          } text-white rounded-md p-2 hover:bg-opacity-75`}
        >
          {editandoIndex !== null ? 'Atualizar Produto' : 'Adicionar Produto'}
        </button>
      </div>

      {erro && (
        <p className="text-red-500 mb-4">{erro}</p>
      )}

      <div className="overflow-x-auto mb-4">
        <table className="w-full min-w-max table-auto">
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
                <td className="px-4 py-2 border-2 border-black">
                  <button
                    onClick={() => handleDecrementarQuantidade(index)}
                    className="bg-gray-400 text-white rounded-md py-1 px-2"
                  >
                    -
                  </button>
                  <span className="mx-2">{produto.quantidade}</span>
                  <button
                    onClick={() => handleIncrementarQuantidade(index)}
                    className="bg-gray-400 text-white rounded-md py-1 px-1.5"
                  >
                    +
                  </button>
                </td>
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
      </div>

      <div className="flex w-full justify-between mt-4">
        <h2 className="text-xl font-bold">
          Total da Compra: <span className="text-green-500">R$ {calcularTotalCompra().toFixed(2)}</span>
        </h2>
        <button 
          onClick={gerarPDF} 
          className="bg-green-500 text-white rounded-md p-2 hover:bg-green-600"
        >
          Gerar PDF
        </button>
      </div>

      {valorMaximoConfirmadoNumerico > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">
            Valor Máximo Confirmado: <span className="text-green-500">R$ {valorMaximoConfirmadoNumerico.toFixed(2)}</span>
          </h2>
          <h2 className="text-xl font-bold mt-2">
            Valor Excedente: <span className="text-red-500">R$ {Math.max(0, calcularTotalCompra() - valorMaximoConfirmadoNumerico).toFixed(2)}</span>
          </h2>
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white w-full max-w-md p-6 rounded-lg">
            <h2 className="text-xl text-black font-bold mb-4">Valor Máximo Atingido</h2>
            <p className="mb-4 text-black">O valor da compra excedeu o valor máximo estipulado. Deseja continuar e adicionar o produto ou revisar os itens?</p>
            <div className="flex justify-end">
              <button
                onClick={handleModalRevisar}
                className="bg-red-500 text-white rounded-md p-2 hover:bg-red-600 mr-2"
              >
                Revisar
              </button>
              <button
                onClick={handleModalConfirmar}
                className="bg-blue-500 text-white rounded-md p-2 hover:bg-blue-600"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValorMaximo;
