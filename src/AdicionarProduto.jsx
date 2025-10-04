import { useState, useEffect } from "react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTheme } from './ThemeContext';

const AdicionarProduto = ({ onGoHome }) => {
  const [nomeProduto, setNomeProduto] = useState("");
  const [valorProduto, setValorProduto] = useState("");
  const [quantidadeProduto, setQuantidadeProduto] = useState("");
  const [erro, setErro] = useState("");
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const { modoNoturno, toggleModoNoturno } = useTheme(); 

  useEffect(() => {
    const produtosSalvos = localStorage.getItem("produtos");
    if (produtosSalvos) {
      setProdutos(JSON.parse(produtosSalvos));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("produtos", JSON.stringify(produtos));
  }, [produtos]);

  const handleAddProduto = () => { 
      if (!nomeProduto || !valorProduto || !quantidadeProduto) {
          setErro('Por favor, preencha todos os campos.');
          setTimeout(() => setErro(""), 1500);
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
      setIsOpen(false);
  };

  const handleEditProduto = (index) => {
      const produto = produtos[index];
      setNomeProduto(produto.nome);
      setValorProduto(produto.valor.toString());
      setQuantidadeProduto(produto.quantidade.toString());
      setEditandoIndex(index);
      setIsOpen(true);
  };

  const handleDeleteProduto = (index) => {
      setProdutos(produtos.filter((_, i) => i !== index));
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

  const AcoesBotoes = ({ index }) => (
    <td className="px-4 py-2 flex gap-2 justify-center">
        <button 
            onClick={() => handleEditProduto(index)} 
            className="bg-yellow-500 text-white rounded-md p-2 hover:bg-yellow-600 transition duration-150"
        >
            Editar
        </button>
        <button
            onClick={() => handleDeleteProduto(index)}
            className="bg-red-500 text-white rounded-md p-2 hover:bg-red-600 transition duration-150"
        >
            Excluir
        </button>
    </td>
  );

  return (
    <div className={`min-h-screen p-6 relative ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
        
      <button 
          onClick={onGoHome}
          className="fixed top-4 left-4 z-50 p-3 rounded-full shadow-lg transition duration-300 text-sm font-semibold
                    bg-white text-gray-800 hover:bg-gray-200 
                    dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
      >
          🏠
      </button>

      <button 
          onClick={toggleModoNoturno}
          className="fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition duration-300 text-sm font-semibold
                    bg-white text-gray-800 hover:bg-gray-200 
                    dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
      >
          {modoNoturno ? '☀️' : '🌙'}
      </button>

      <div className="container mx-auto max-w-4xl pt-10">
        <h1 className="py-4 text-center text-4xl font-extrabold">
            Sua Lista de Compras 🛒
        </h1>

        <div className={`overflow-x-auto mb-6 p-4 rounded-xl shadow-lg border ${modoNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <table className="min-w-full border-collapse">
            <thead>
              <tr className=" uppercase text-sm">
                <th className="px-4 py-3 border-b-2 border-gray-300 dark:border-gray-600 text-left">Produto</th>
                <th className="px-4 py-3 border-b-2 border-gray-300 dark:border-gray-600">Valor Und.</th>
                <th className="px-4 py-3 border-b-2 border-gray-300 dark:border-gray-600">Qtd.</th>
                <th className="px-4 py-3 border-b-2 border-gray-300 dark:border-gray-600">Total</th>
                <th className="px-4 py-3 border-b-2 border-gray-300 dark:border-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.length === 0 ? (
                <tr className="">
                  <td colSpan="5" className="text-center py-10">
                    <p className="font-semibold text-lg mb-2">Sua lista de compras está vazia. 📝</p>
                    <p>Clique em <b>'+ Adicionar Produto'</b> para começar a cadastrar seus itens!</p>
                  </td>
                </tr>
              ) : (
                <>
                  {produtos.map((produto, index) => (
                    <tr 
                      key={index} 
                      className={`text-center transition duration-100 ${index % 2 === 0 ? ' ' : ''}`}
                    >
                      <td className="px-4 py-2 border-b dark:border-gray-700 text-left">{produto.nome}</td>
                      <td className="px-4 py-2 border-b dark:border-gray-700">R$ {produto.valor.toFixed(2)}</td>
                      <td className="px-4 py-2 border-b dark:border-gray-700">{produto.quantidade}</td>
                      <td className="px-4 py-2 border-b dark:border-gray-700 font-semibold">R$ {produto.total.toFixed(2)}</td>
                      <AcoesBotoes index={index} />
                    </tr>
                  ))}
                  <tr className={`border-t-4 border-green-500 dark:border-green-600 font-bold text-lg ${modoNoturno ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}>
                    <td className="px-4 py-3 text-right" colSpan="3">Total Geral:</td>
                    <td className="px-4 py-3 text-center text-green-600 dark:text-green-400">R$ {calcularTotalCompra().toFixed(2)}</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
        <button
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mt-6 transition"
          >
            + Adicionar Novo Produto
          </button>


        {isOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg dark:bg-gray-800">
              <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                {editandoIndex !== null ? "Editar Produto" : "Adicionar Produto"}
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Nome do Produto"
                  value={nomeProduto}
                  onChange={(e) => setNomeProduto(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="col-span-3 sm:col-span-1 border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
                <input
                  type="number"
                  placeholder="Valor (R$)"
                  value={valorProduto}
                  onChange={(e) => setValorProduto(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
                <input
                  type="number"
                  placeholder="Quantidade"
                  value={quantidadeProduto}
                  onChange={(e) => setQuantidadeProduto(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
                <button
                  onClick={handleAddProduto}
                  className="bg-blue-600 text-white font-semibold rounded-lg p-3 hover:bg-blue-700 col-span-1 sm:col-span-2 transition"
                >
                  {editandoIndex !== null ? "Atualizar Produto" : "Adicionar Produto"}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setErro("");
                    setEditandoIndex(null);
                    setNomeProduto("");
                    setValorProduto("");
                    setQuantidadeProduto("");
                  }}
                  className="bg-red-600 text-white font-semibold rounded-lg p-3 hover:bg-red-700 col-span-1 sm:col-span-1 transition"
                >
                  Cancelar
                </button>
              </div>
              {erro && <p className="text-red-500 font-medium mt-2">{erro}</p>}
            </div>
          </div>
        )}

        {produtos.length > 0 && (
          <div className="flex justify-end p-0">
            <button 
              onClick={gerarPDF} 
              className="bg-green-600 text-white font-semibold rounded-lg p-3 hover:bg-green-700 transition"
            >
              📥 Gerar PDF do Relatório
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdicionarProduto;