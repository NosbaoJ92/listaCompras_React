import { useState, useEffect } from "react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTheme } from './ThemeContext';

// Definições de Largura de Coluna OTIMIZADAS (Total = 100% da largura do container)
// Agora que não há coluna de Ações separada, podemos usar classes de porcentagem/flexbox simples.
const COL_NOME = "w-1/2"; // 50%
const COL_VALOR_QTD = "w-1/6"; // 16.67% (para Valor Unitário e Quantidade)
const COL_TOTAL = "w-1/6"; // 16.67% (para Total)
// Total: 50 + 16.67 + 16.67 + 16.67 ≈ 100%

const AdicionarProduto = ({ onGoHome }) => {
  const [nomeProduto, setNomeProduto] = useState("");
  const [valorProduto, setValorProduto] = useState("");
  const [quantidadeProduto, setQuantidadeProduto] = useState("");
  const [erro, setErro] = useState("");
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  // Armazena o índice do produto cuja linha foi clicada para mostrar as ações
  const [produtoSelecionadoIndex, setProdutoSelecionadoIndex] = useState(null); 

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
      setProdutoSelecionadoIndex(null); // Fecha o pop-up de ação
  };

  const handleDeleteProduto = (index) => {
      setProdutos(produtos.filter((_, i) => i !== index));
      setProdutoSelecionadoIndex(null); // Fecha o pop-up de ação
  };

  const calcularTotalCompra = () => {
    return produtos.reduce((acc, produto) => acc + produto.total, 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddProduto();
    }
  };

  // Alterna a linha selecionada para mostrar os ícones de ação
  const handleRowClick = (index) => {
      setProdutoSelecionadoIndex(index === produtoSelecionadoIndex ? null : index);
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
      
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 30; 
      
      doc.text(`Total da Compra: R$ ${totalCompra}`, 10, finalY + 10);

      doc.save('lista-produtos.pdf');
  };


  return (
    <div className={`min-h-screen p-6 relative flex flex-col ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
        
      {/* Botões fixos (Home/Tema) */}
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

      {/* Conteúdo Principal */}
      <div className="container mx-auto max-w-4xl pt-10 flex-grow">
        <h1 className="py-4 text-center text-4xl font-extrabold">
            Sua Lista de Compras 🛒
        </h1>

        {/* CONTAINER PRINCIPAL DA TABELA: Define a largura da "tabela" */}
        <div className={`p-4 rounded-xl shadow-lg border ${modoNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            
            {/* CABEÇALHO (TOPO) - Fixo verticalmente */}
            <div className="border-b-2 border-gray-300 dark:border-gray-600 sticky top-0 bg-inherit z-10">
                {/* Removido o min-w-fit e overflow-x-auto, a largura agora é controlada pelas classes COL_* que somam 100% */}
                <div className="flex uppercase text-sm font-bold w-full"> 
                    <div className={`px-4 py-3 text-left ${COL_NOME}`}>Produto</div>
                    <div className={`px-4 py-3 text-center ${COL_VALOR_QTD}`}>Valor Und.</div>
                    <div className={`px-4 py-3 text-center ${COL_VALOR_QTD}`}>Qtd.</div>
                    <div className={`px-4 py-3 text-center ${COL_TOTAL}`}>Total</div>
                </div>
            </div>

            {/* CORPO (ITENS) - Área de rolagem vertical (max-h-96) */}
            {/* Removido overflow-x-auto para forçar o ajuste de largura total */}
            <div className="overflow-y-scroll max-h-96">
                {produtos.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="font-semibold text-lg mb-2">Sua lista de compras está vazia. 📝</p>
                    <p>Clique em <b>'+ Adicionar Produto'</b> para começar a cadastrar seus itens!</p>
                  </div>
                ) : (
                  <div>
                    {produtos.map((produto, index) => (
                        // Linha do Produto
                      <div 
                        key={index} 
                        onClick={() => handleRowClick(index)} // Ação de clique na linha
                        className={`flex border-b dark:border-gray-700 transition duration-100 cursor-pointer w-full relative
                                    ${index === produtoSelecionadoIndex ? 'bg-blue-100/50 dark:bg-blue-900/70' : (index % 2 === 0 ? ' ' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50')}`}
                      >
                        {/* Célula Produto */}
                        <div className={`px-4 py-3 text-left flex items-center ${COL_NOME}`}>
                            {produto.nome}
                        </div>
                        {/* Célula Valor Und. */}
                        <div className={`px-4 py-3 text-center flex items-center justify-center ${COL_VALOR_QTD}`}>R$ {produto.valor.toFixed(2)}</div>
                        {/* Célula Qtd. */}
                        <div className={`px-4 py-3 text-center flex items-center justify-center ${COL_VALOR_QTD}`}>{produto.quantidade}</div>
                        {/* Célula Total */}
                        <div className={`px-4 py-3 font-semibold text-center flex items-center justify-center ${COL_TOTAL}`}>R$ {produto.total.toFixed(2)}</div>

                        {/* POP-UP DE AÇÕES */}
                        {index === produtoSelecionadoIndex && (
                            <div className="absolute top-1/2 right-4 transform -translate-y-1/2 flex gap-2 z-20 p-1 rounded-lg bg-white/70 backdrop-blur-sm dark:bg-gray-900/70 shadow-md">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleEditProduto(index); }} 
                                    className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition"
                                    title="Editar"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteProduto(index); }}
                                    className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
                                    title="Excluir"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* RODAPÉ (TOTAL GERAL) - Fixo verticalmente */}
            {produtos.length > 0 && (
                <div className={`border-t-4 border-green-500 dark:border-green-600 font-bold text-lg ${modoNoturno ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} w-full`}>
                    {/* Removido overflow-x-auto e min-w-fit */}
                    <div className="flex w-full">
                        {/* Coluna "Total Geral" (Mescla as três primeiras colunas) */}
                        <div className={`px-4 py-3 text-right flex items-center justify-end ${COL_NOME} ${COL_VALOR_QTD} ${COL_VALOR_QTD} `}>
                            Total Geral:
                        </div> 
                        {/* Coluna do Valor Total */}
                        <div className={`px-4 py-3 text-center text-green-600 dark:text-green-400 flex items-center justify-center ${COL_TOTAL}`}>
                            R$ {calcularTotalCompra().toFixed(2)}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Modal (Adicionar/Editar) - Omitido para brevidade... */}
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
                  className="col-span-3 sm:col-span-1 border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
                <input
                  type="number"
                  placeholder="Quantidade"
                  value={quantidadeProduto}
                  onChange={(e) => setQuantidadeProduto(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="col-span-3 sm:col-span-1 border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
                <button
                  onClick={handleAddProduto}
                  className="bg-blue-600 text-white font-semibold rounded-lg p-3 hover:bg-blue-700 col-span-3 sm:col-span-2 transition"
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
                  className="bg-red-600 text-white font-semibold rounded-lg p-3 hover:bg-red-700 col-span-3 sm:col-span-1 transition"
                >
                  Cancelar
                </button>
              </div>
              {erro && <p className="text-red-500 font-medium mt-2">{erro}</p>}
            </div>
          </div>
        )}
      </div>

    {/* Rodapé da Página: Botões de ação */}
    <div className="container mx-auto max-w-4xl p-6 flex justify-between items-center w-full mt-4">
        <button
            onClick={() => { setIsOpen(true); setEditandoIndex(null); }} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
        >
            + Adicionar Novo Produto
        </button>

        {produtos.length > 0 && (
            <button 
                onClick={gerarPDF} 
                className="bg-green-600 text-white font-semibold rounded-lg p-3 hover:bg-green-700 transition"
            >
                📥 Gerar PDF do Relatório
            </button>
        )}
    </div>
    </div>
  );
};

export default AdicionarProduto;