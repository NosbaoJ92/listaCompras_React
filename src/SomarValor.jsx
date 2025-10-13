import { useState, useEffect } from "react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTheme } from './ThemeContext'; 
import { BrowserMultiFormatReader } from "@zxing/library";
import produtosBR from './produtosBR.json';



const COL_NOME = "w-2/5";
const COL_VALOR = "w-1/5";
const COL_QTD = "w-1/5";
const COL_TOTAL = "w-1/5";

const SomarValor = ({ onGoHome }) => {
  const [ean, setEan] = useState("");
  const [nomeProduto, setNomeProduto] = useState("");
  const [valorProduto, setValorProduto] = useState("");
  const [quantidadeProduto, setQuantidadeProduto] = useState("");
  const [erro, setErro] = useState("");
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [produtoSelecionadoIndex, setProdutoSelecionadoIndex] = useState(null);

  const { modoNoturno, toggleModoNoturno } = useTheme(); 

  const [leitorAtivo, setLeitorAtivo] = useState(false);
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    const produtosSalvos = localStorage.getItem("produtos");
    if (produtosSalvos) setProdutos(JSON.parse(produtosSalvos));
  }, []);

  useEffect(() => {
    localStorage.setItem("produtos", JSON.stringify(produtos));
  }, [produtos]);

  // 🔍 Função para buscar produto na API EANData
  const buscarProdutoPorEan = async (codigoEan) => {
  if (!codigoEan) {
    setErro("Informe um código EAN válido.");
    setTimeout(() => setErro(""), 1500);
    return;
  }

  // 🔹 1. Busca no JSON local
  const produtoLocal = produtosBR.find(p => p.ean === codigoEan);
  if (produtoLocal) {
    setNomeProduto(produtoLocal.nome);
    setValorProduto(produtoLocal.valor.toString());
    setErro("");
    return; // retorna sem chamar a API externa
  }

  // 🔹 2. Se não achou local, busca na API EANData
  try {
    const apiKey = "4210726968ED3C18"; // sua key
    const url = `https://eandata.com/feed/?v=3&keycode=${apiKey}&mode=json&find=${codigoEan}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.product) {
      const produto = data.product;
      const nome = produto.attributes?.product || produto.title || "Produto não identificado";
      const preco = produto.attributes?.price || "";

      setNomeProduto(nome);
      if (preco) setValorProduto(preco.toString());
      setErro("");
    } else {
      setErro("Produto não encontrado no EANData.");
      setTimeout(() => setErro(""), 1500);
    }
  } catch (err) {
    console.error(err);
    setErro("Erro ao consultar o EANData.");
    setTimeout(() => setErro(""), 1500);
  }
};


  useEffect(() => {
  if (!isOpen) return;

  const codeReader = new BrowserMultiFormatReader();
  const videoElement = document.getElementById("video");

  if (videoElement) {
    codeReader
      .listVideoInputDevices()
      .then((devices) => {
        if (devices.length > 0) {
          codeReader.decodeFromVideoDevice(devices[0].deviceId, "video", (result, err) => {
            if (result) {
              const codigo = result.getText();
              setEan(codigo);
              buscarProdutoPorEan(codigo);
              codeReader.reset(); // para parar a leitura após detectar
            }
          });
        }
      })
      .catch((err) => console.error(err));
  }

  return () => codeReader.reset();
}, [isOpen]);

  const handleAddProduto = () => { 
    if (!nomeProduto || !valorProduto || !quantidadeProduto) {
      setErro('Por favor, preencha todos os campos.');
      setTimeout(() => setErro(""), 1500);
      return;
    }

    const novoProduto = {
      ean: ean || null,
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

    setEan('');
    setNomeProduto('');
    setValorProduto('');
    setQuantidadeProduto('');
    setErro('');
    setIsOpen(false);
    setProdutoSelecionadoIndex(null);
  };

  const handleEditProduto = (index) => {
    const produto = produtos[index];
    setEan(produto.ean || "");
    setNomeProduto(produto.nome);
    setValorProduto(produto.valor.toString());
    setQuantidadeProduto(produto.quantidade.toString());
    setEditandoIndex(index);
    setIsOpen(true);
    setProdutoSelecionadoIndex(null);
  };

  const handleDeleteProduto = (index) => {
    setProdutos(produtos.filter((_, i) => i !== index));
    setProdutoSelecionadoIndex(null);
  };

  const calcularTotalCompra = () => {
    return produtos.reduce((acc, produto) => acc + produto.total, 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAddProduto();
  };

  const handleRowClick = (index) => {
    setProdutoSelecionadoIndex(index === produtoSelecionadoIndex ? null : index);
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de gestão de compras", 10, 10);
    const tableColumn = ["EAN", "Nome", "Valor Unitário", "Quantidade", "Total"];
    const tableRows = produtos.map((p) => [
      p.ean || "-",
      p.nome,
      `R$ ${p.valor.toFixed(2)}`,
      p.quantidade,
      `R$ ${p.total.toFixed(2)}`
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

      {/* Botões fixos */}
      <button onClick={onGoHome} className="fixed top-4 left-4 z-50 p-3 rounded-full shadow-lg transition duration-300 bg-white text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">🏠</button>
      <button onClick={toggleModoNoturno} className="fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition duration-300 bg-white text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
        {modoNoturno ? '☀️' : '🌙'}
      </button>

      <div className="container mx-auto max-w-4xl pt-8 flex-grow">
        <h1 className="py-4 text-center text-4xl font-extrabold">Sua Lista de Compras 🛒</h1>

        {/* Lista de produtos */}
        <div className={`p-4 mt-4 rounded-xl shadow-lg border ${modoNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="overflow-y-scroll max-h-96">
            {produtos.length === 0 ? (
              <div className="text-center py-10">
                <p className="font-semibold text-lg mb-2">Sua lista de compras está vazia. 📝</p>
                <p>Clique em <b>'+ Adicionar Produto'</b> para começar!</p>
              </div>
            ) : (
            <div>
                    {produtos.map((produto, index) => (
                        // Linha do Produto
                      <div 
                        key={index} 
                        onClick={() => handleRowClick(index)} // Ação de clique na linha
                        // flex-col para mobile, sm:flex-row para desktop
                        className={`flex flex-col sm:flex-row border-b dark:border-gray-700 transition duration-100 cursor-pointer w-full relative
                                    ${index === produtoSelecionadoIndex ? 'bg-blue-100/50 dark:bg-blue-900/70' : (index % 2 === 0 ? ' ' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50')}`}
                      >
                        {/* =======================================================
                            1. LAYOUT DE CARTÃO (MOBILE: sm:hidden)
                        ======================================================= */}
                        <div className={`p-4 sm:hidden w-full`}>
                            {/* Nome do Produto (Destaque) */}
                            <div className="font-extrabold text-lg mb-2">{produto.nome}</div>
                            
                            <div className="grid grid-cols-3 gap-y-1 gap-x-4 text-sm">
                                
                                {/* Valor Unitário */}
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-400">Valor Und.:</span>
                                    <span className="font-medium">R$ {produto.valor.toFixed(2)}</span>
                                </div>
                                
                                {/* Quantidade */}
                                <div className="flex flex-col text-center">
                                    <span className="font-semibold text-gray-400">Qtd.:</span>
                                    <span className="font-medium">{produto.quantidade}</span>
                                </div>
                                
                                {/* Total do Item (Destaque) */}
                                <div className="flex flex-col items-end">
                                    <span className="font-semibold text-gray-400">Total Item:</span>
                                    <span className="text-lg font-bold text-green-500">R$ {produto.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* =======================================================
                            2. LAYOUT DE TABELA (DESKTOP: hidden sm:flex)
                        ======================================================= */}
                        <div className="hidden sm:flex w-full">
                            {/* Célula Produto (40%) - ESQUERDA */}
                            <div className={`px-4 py-3 text-left flex items-center ${COL_NOME}`}>
                                {produto.nome}
                            </div>
                            {/* Célula Valor Und. (20%) - DIREITA */}
                            <div className={`px-4 py-3 text-right flex items-center justify-end ${COL_VALOR}`}>R$ {produto.valor.toFixed(2)}</div>
                            {/* Célula Qtd. (20%) - CENTRO */}
                            <div className={`px-4 py-3 text-center flex items-center justify-center ${COL_QTD}`}>{produto.quantidade}</div>
                            {/* Célula Total (20%) - DIREITA e Destaque */}
                            <div className={`px-4 py-3 font-semibold text-right flex items-center justify-end ${COL_TOTAL} text-lg text-green-600 dark:text-green-400`}>R$ {produto.total.toFixed(2)}</div>
                        </div>

                        {/* POP-UP DE AÇÕES */}
                        {index === produtoSelecionadoIndex && (
                            <div className="absolute top-1/2 right-4 transform -translate-y-1/2 flex gap-2 z-20 p-4 rounded-lg bg-white/70 backdrop-blur-sm dark:bg-gray-900/70 shadow-md">
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

          {produtos.length > 0 && (
            <div className="border-t-4 border-green-500 font-bold p-4 text-right text-2xl text-green-600 dark:text-green-400">
              Total: R$ {calcularTotalCompra().toFixed(2)}
            </div>
          )}
        </div>

        {/* Modal de adicionar/editar produto */}
        {isOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg dark:bg-gray-800">
                <h1 className="text-2xl font-bold mb-6 text-white">
                    {editandoIndex !== null ? "Editar Produto" : "Adicionar Produto"}
                </h1>
                {/* Área de leitura (aparece só quando leitor ativo) */}
                {leitorAtivo && (
                    <div className="mb-4">
                        <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden">
                            <video
                            id="video"
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            />
                        <div className="absolute inset-0 border-4 border-green-500 opacity-60 pointer-events-none"></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        Aponte a câmera para o código de barras (EAN). O preenchimento será automático.
                    </p>
                    </div>
                )}

                <div className="flex flex-col gap-4 mb-4">
                    <input
                    type="number"
                    placeholder="EAN do Produto"
                    value={ean}
                    onChange={(e) => setEan(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && buscarProdutoPorEan(ean)}
                    className="col-span-2 border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                    
                    <div className="mb-4 flex text-sm justify-between w-full gap-2">
                        <button
                        onClick={() => buscarProdutoPorEan(ean)}
                        className="bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full"
                        >
                        Buscar
                        </button>
                        <button
                        onClick={() => setLeitorAtivo(!leitorAtivo)}
                        className={`px-4 py-2 rounded-lg transition  w-full ${
                            leitorAtivo
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                        >
                        {leitorAtivo ? "Parar Leitura" : "Ler código"}
                        </button>
                    </div>
                    <input
                    type="text"
                    placeholder="Nome do Produto"
                    value={nomeProduto}
                    onChange={(e) => setNomeProduto(e.target.value)}
                    className="col-span-3 border border-gray-300 rounded-lg p-3 text-gray-700 dark:bg-gray-700 dark:text-gray-100"
                    />
                    <input
                    type="number"
                    placeholder="Valor (R$)"
                    value={valorProduto}
                    onChange={(e) => setValorProduto(e.target.value)}
                    className="col-span-3 sm:col-span-1 border border-gray-300 rounded-lg p-3 text-gray-700 dark:bg-gray-700 dark:text-gray-100"
                    />
                    <input
                    type="number"
                    placeholder="Quantidade"
                    value={quantidadeProduto}
                    onChange={(e) => setQuantidadeProduto(e.target.value)}
                    className="col-span-3 sm:col-span-1 border border-gray-300 rounded-lg p-3 text-gray-700 dark:bg-gray-700 dark:text-gray-100"
                    />
                    <div className="mb-4 flex w-full text-sm gap-2 justify-between">
                        <button
                        onClick={handleAddProduto}
                        className="bg-blue-600 text-white w-full font-semibold rounded-lg  hover:bg-blue-700 transition"
                        >
                        {editandoIndex !== null ? "Atualizar Produto" : "Adicionar Produto"}
                        </button>
                        <button
                        onClick={() => {
                            setIsOpen(false);
                            setErro("");
                            setEditandoIndex(null);
                            setEan("");
                            setNomeProduto("");
                            setValorProduto("");
                            setQuantidadeProduto("");
                            setLeitorAtivo(false);
                            if (scanner) scanner.reset();
                        }}
                        className="bg-red-600 text-white font-semibold w-full rounded-lg  hover:bg-red-700 transition"
                        >
                        Cancelar
                        </button>
                    </div>
                    
                </div>
                {erro && <p className="text-red-500 font-medium mt-2">{erro}</p>}
                </div>
            </div>
            )}
      </div>

      <div className="container mx-auto max-w-4xl flex justify-between items-center w-full mt-4">
        <button
          onClick={() => { setIsOpen(true); setEditandoIndex(null); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          + Adicionar Novo Produto
        </button>
      </div>
    </div>
  );
};

export default SomarValor;
