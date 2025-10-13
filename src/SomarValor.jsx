import { useState, useEffect, useRef } from "react";
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
  const codeReaderRef = useRef(null);

  useEffect(() => {
    const produtosSalvos = localStorage.getItem("produtos");
    if (produtosSalvos) setProdutos(JSON.parse(produtosSalvos));
  }, []);

  useEffect(() => {
    localStorage.setItem("produtos", JSON.stringify(produtos));
  }, [produtos]);

  const buscarProdutoPorEan = async (codigoEan) => {
    if (!codigoEan) {
      setErro("Informe um código EAN válido.");
      setTimeout(() => setErro(""), 1500);
      return;
    }

    const produtoLocal = produtosBR.find(p => p.ean === codigoEan);
    if (produtoLocal) {
      setNomeProduto(produtoLocal.nome);
      setValorProduto(produtoLocal.valor.toString());
      setErro("");
      return;
    }

    try {
      const apiKey = "4210726968ED3C18";
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

  // 🔹 Scanner
  useEffect(() => {
    if (!leitorAtivo) {
      if (codeReaderRef.current) codeReaderRef.current.reset();
      return;
    }

    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    codeReader.listVideoInputDevices()
      .then((devices) => {
        if (devices.length > 0) {
          codeReader.decodeFromVideoDevice(devices[0].deviceId, "video", (result, err) => {
            if (result) {
              const codigo = result.getText();
              setEan(codigo);
              buscarProdutoPorEan(codigo);
              codeReader.reset();
              setLeitorAtivo(false);
            }
          });
        } else {
          setErro("Nenhuma câmera encontrada.");
        }
      })
      .catch((err) => console.error(err));

    return () => codeReader.reset();
  }, [leitorAtivo]);

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
    setLeitorAtivo(false);
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

  const calcularTotalCompra = () => produtos.reduce((acc, produto) => acc + produto.total, 0);

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

    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
    const totalCompra = calcularTotalCompra().toFixed(2);
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 30; 
    doc.text(`Total da Compra: R$ ${totalCompra}`, 10, finalY + 10);
    doc.save('lista-produtos.pdf');
  };

  return (
    <div className={`min-h-screen p-6 relative flex flex-col ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
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
                  <div key={index} onClick={() => handleRowClick(index)}
                    className={`flex flex-col sm:flex-row border-b dark:border-gray-700 transition duration-100 cursor-pointer w-full relative
                    ${index === produtoSelecionadoIndex ? 'bg-blue-100/50 dark:bg-blue-900/70' : (index % 2 === 0 ? ' ' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50')}`}>
                    {/* Mobile layout */}
                    <div className={`p-4 sm:hidden w-full`}>
                      <div className="font-extrabold text-lg mb-2">{produto.nome}</div>
                      <div className="grid grid-cols-3 gap-y-1 gap-x-4 text-sm">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-400">Valor Und.:</span>
                          <span className="font-medium">R$ {produto.valor.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col text-center">
                          <span className="font-semibold text-gray-400">Qtd.:</span>
                          <span className="font-medium">{produto.quantidade}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-gray-400">Total Item:</span>
                          <span className="text-lg font-bold text-green-500">R$ {produto.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Desktop layout */}
                    <div className="hidden sm:flex w-full">
                      <div className={`px-4 py-3 text-left flex items-center ${COL_NOME}`}>{produto.nome}</div>
                      <div className={`px-4 py-3 text-right flex items-center justify-end ${COL_VALOR}`}>R$ {produto.valor.toFixed(2)}</div>
                      <div className={`px-4 py-3 text-center flex items-center justify-center ${COL_QTD}`}>{produto.quantidade}</div>
                      <div className={`px-4 py-3 font-semibold text-right flex items-center justify-end ${COL_TOTAL} text-lg text-green-600 dark:text-green-400`}>R$ {produto.total.toFixed(2)}</div>
                    </div>

                    {index === produtoSelecionadoIndex && (
                      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 flex gap-2 z-20 p-4 rounded-lg bg-white/70 backdrop-blur-sm dark:bg-gray-900/70 shadow-md">
                        <button onClick={(e) => { e.stopPropagation(); handleEditProduto(index); }} className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition" title="Editar">✏️</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteProduto(index); }} className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition" title="Excluir">🗑️</button>
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

        {/* Modal */}
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg dark:bg-gray-800">
              <h1 className="text-2xl font-bold mb-6 text-white">
                {editandoIndex !== null ? "Editar Produto" : "Adicionar Produto"}
              </h1>

              {leitorAtivo && (
                <div className="mb-4">
                  <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden">
                    <video id="video" className="w-full h-full object-cover" autoPlay muted />
                    <div className="absolute inset-0 border-4 border-green-500 opacity-60 pointer-events-none"></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Aponte a câmera para o código de barras (EAN). O preenchimento será automático.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-4 mb-4">
                <input type="number" placeholder="EAN do Produto" value={ean} onChange={(e) => setEan(e.target.value)} className="col-span-2 border border-gray-300 rounded-lg p-3 text-gray-700 dark:bg-gray-700 dark:text-gray-100" />
                
                <div className="mb-4 flex text-sm justify-between w-full gap-2">
                  <button onClick={() => buscarProdutoPorEan(ean)} className="bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full">Buscar</button>
                  <button onClick={() => setLeitorAtivo(!leitorAtivo)} className={`px-4 py-2 rounded-lg transition  w-full ${leitorAtivo ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-600 text-white hover:bg-green-700"}`}>
                    {leitorAtivo ? "Parar Leitura" : "Ler código"}
                  </button>
                </div>

                <input type="text" placeholder="Nome do Produto" value={nomeProduto} onChange={(e) => setNomeProduto(e.target.value)} className="col-span-3 border border-gray-300 rounded-lg p-3 text-gray-700 dark:bg-gray-700 dark:text-gray-100" />
                <input type="number" placeholder="Valor (R$)" value={valorProduto} onChange={(e) => setValorProduto(e.target.value)} className="col-span-3 sm:col-span-1 border border-gray-300 rounded-lg p-3 text-gray-700 dark:bg-gray-700 dark:text-gray-100" />
                <input type="number" placeholder="Quantidade" value={quantidadeProduto} onChange={(e) => setQuantidadeProduto(e.target.value)} className="col-span-3 sm:col-span-1 border border-gray-300 rounded-lg p-3 text-gray-700 dark:bg-gray-700 dark:text-gray-100" />

                <div className="mb-4 flex w-full text-sm gap-2 justify-between">
                  <button onClick={handleAddProduto} className="bg-blue-600 text-white w-full font-semibold rounded-lg hover:bg-blue-700 transition">{editandoIndex !== null ? "Atualizar Produto" : "Adicionar Produto"}</button>
                  <button onClick={() => { setIsOpen(false); setErro(""); setEditandoIndex(null); setEan(""); setNomeProduto(""); setValorProduto(""); setQuantidadeProduto(""); setLeitorAtivo(false); if(codeReaderRef.current) codeReaderRef.current.reset(); }} className="bg-red-600 text-white font-semibold w-full rounded-lg hover:bg-red-700 transition">Cancelar</button>
                </div>
              </div>

              {erro && <p className="text-red-500 font-medium mt-2">{erro}</p>}
            </div>
          </div>
        )}

        <div className="container mx-auto max-w-4xl flex justify-between items-center w-full mt-4">
          <button onClick={() => { setIsOpen(true); setEditandoIndex(null); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
            + Adicionar Novo Produto
          </button>
        </div>
      </div>
    </div>
  );
};

export default SomarValor;
