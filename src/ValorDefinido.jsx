import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Definições de Largura OTIMIZADAS (para manter a consistência visual)
const COL_NOME = "w-2/5"; // 40%
const COL_VALOR = "w-1/5"; // 20%
const COL_QTD = "w-1/5"; // 20%
const COL_TOTAL = "w-1/5"; // 20%

// O componente agora recebe modoNoturno e onToggleModoNoturno via props
const ValorDefinido = ({ onGoHome, modoNoturno, onToggleModoNoturno }) => {
    
    // 1. Inicializa o valor pré-definido lendo do localStorage
    const getInitialValorPreDefinido = () => {
        return localStorage.getItem("valorPreDefinido") || '';
    };

    const initialValorPreDefinido = getInitialValorPreDefinido();
    
    // ESTADOS
    const [produtos, setProdutos] = useState([]);
    const [nomeProduto, setNomeProduto] = useState('');
    const [valorProduto, setValorProduto] = useState('');
    const [quantidadeProduto, setQuantidadeProduto] = useState('');
    const [valorPreDefinido, setValorPreDefinido] = useState(initialValorPreDefinido);
    const [erro, setErro] = useState('');
    const [editandoIndex, setEditandoIndex] = useState(null);
    const [isPDFMenuOpen, setIsPDFMenuOpen] = useState(false);
    const [produtoSelecionadoIndex, setProdutoSelecionadoIndex] = useState(null);
    
    // isBudgetEditing inicializa como TRUE se valorPreDefinido for vazio
    const [isBudgetEditing, setIsBudgetEditing] = useState(initialValorPreDefinido === ''); 
    const [isModalOpen, setIsModalOpen] = useState(false); 

    // EFEITOS (Carregar/Salvar)
    useEffect(() => {
        const produtosSalvos = localStorage.getItem("produtosDefinido");
        if (produtosSalvos) {
            setProdutos(JSON.parse(produtosSalvos));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("produtosDefinido", JSON.stringify(produtos));
    }, [produtos]);

    useEffect(() => {
        localStorage.setItem("valorPreDefinido", valorPreDefinido);
    }, [valorPreDefinido]);

    // HANDLERS
    const handleSetBudget = (novoValor) => {
        const valorNumerico = parseFloat(novoValor.replace(',', '.'));

        if (!isNaN(valorNumerico) && valorNumerico >= 0) {
            setValorPreDefinido(novoValor);
            setIsBudgetEditing(false); 
        } else {
            setErro('Por favor, insira um valor numérico positivo.');
            setTimeout(() => setErro(''), 3000);
        }
    };
    
    // FUNÇÃO CORRIGIDA: Implementa a checagem de orçamento máximo
    const handleOpenModal = (index = null) => {
        // --- BLOQUEIO DE ADIÇÃO SEM ORÇAMENTO ---
        // Se o usuário está tentando ADICIONAR (index === null) E o orçamento está vazio, bloqueie.
        if (index === null && !valorPreDefinido) {
            setErro('Por favor, defina o "Orçamento Máximo" antes de adicionar um produto.');
            setTimeout(() => setErro(''), 5000); 
            return; // Bloqueia a abertura do modal
        }
        // --- FIM DO BLOQUEIO ---

        if (index !== null) {
            const produto = produtos[index];
            setNomeProduto(produto.nome);
            setValorProduto(produto.valor.toString());
            setQuantidadeProduto(produto.quantidade.toString());
            setEditandoIndex(index);
        } else {
            setNomeProduto('');
            setValorProduto('');
            setQuantidadeProduto('');
            setEditandoIndex(null);
        }
        setErro('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setNomeProduto('');
        setValorProduto('');
        setQuantidadeProduto('');
        setEditandoIndex(null);
    };

    const handleAddProduto = () => {
        // PRIMEIRA VALIDAÇÃO: Checa se algum campo está vazio (string vazia '')
        if (!nomeProduto || !valorProduto || !quantidadeProduto) {
            setErro('Por favor, preencha todos os campos.');
            setTimeout(() => setErro(''), 3000);
            return;
        }

        const novoValor = parseFloat(valorProduto.replace(',', '.')); 
        const novaQtd = parseInt(quantidadeProduto);

        // SEGUNDA VALIDAÇÃO: Checa se os valores são numéricos e maiores que zero (positivo e definido).
        if (isNaN(novoValor) || isNaN(novaQtd) || novoValor <= 0 || novaQtd <= 0) {
            setErro('Valores e quantidade devem ser números positivos válidos (maiores que zero).');
            setTimeout(() => setErro(''), 3000);
            return;
        }

        const novoProduto = {
            nome: nomeProduto,
            valor: novoValor,
            quantidade: novaQtd,
            total: novoValor * novaQtd,
        };

        if (editandoIndex !== null) {
            const produtosAtualizados = produtos.map((produto, index) =>
                index === editandoIndex ? novoProduto : produto
            );
            setProdutos(produtosAtualizados);
        } else {
            setProdutos([...produtos, novoProduto]);
        }
        
        handleCloseModal(); 
        setProdutoSelecionadoIndex(null);
    };

    const handleEditProduto = (index) => {
        setProdutoSelecionadoIndex(null); 
        handleOpenModal(index);
    };

    const handleDeleteProduto = (index) => {
        const produtosAtualizados = produtos.filter((_, i) => i !== index);
        setProdutos(produtosAtualizados);
        setProdutoSelecionadoIndex(null);
    };

    const calcularTotalCompra = () => {
        return produtos.reduce((acc, produto) => acc + produto.total, 0);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleAddProduto();
        }
    };

    const handleRowClick = (index) => {
        setProdutoSelecionadoIndex(index === produtoSelecionadoIndex ? null : index);
    };

    // Limpa tudo (produtos e valor pré-definido)
    const handleClearAll = () => {
        const confirmClear = window.confirm("Tem certeza de que deseja limpar a lista de produtos E o valor do orçamento? Esta ação é irreversível.");
        
        if (confirmClear) {
            setProdutos([]); 
            setValorPreDefinido('');
            setIsBudgetEditing(true); 
            localStorage.removeItem("produtosDefinido");
            localStorage.removeItem("valorPreDefinido");

            setProdutoSelecionadoIndex(null);
            setErro('Lista de compras e orçamento foram limpos.');
            setTimeout(() => setErro(''), 3000);
        }
    };

    // FUNÇÕES DE PDF (Mantidas)
    const gerarPDF = () => {
        try {
            const doc = new jsPDF();
            doc.text("Relatório de Subtração de Valor Pré-Definido", 10, 10);
            const tableColumn = ["Nome", "Valor Unitário", "Quantidade", "Total"];
            const tableRows = produtos.map((produto) => [
                produto.nome,
                `R$ ${produto.valor.toFixed(2)}`,
                produto.quantidade,
                `R$ ${produto.total.toFixed(2)}`
            ]);
            doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
            const totalCompra = calcularTotalCompra().toFixed(2);
            const valorRestante = (parseFloat(valorPreDefinido || 0) - parseFloat(totalCompra)).toFixed(2);
            const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 30;
            doc.setFontSize(12);
            doc.text(`Total da Compra: R$ ${totalCompra}`, 10, finalY + 10);
            doc.text(`Valor Pré-Definido: R$ ${parseFloat(valorPreDefinido || 0).toFixed(2)}`, 10, finalY + 18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(valorRestante >= 0 ? 34 : 255, valorRestante >= 0 ? 139 : 0, 34);
            doc.text(`Valor Restante: R$ ${valorRestante}`, 10, finalY + 26);
            doc.save('valor-predefinido-relatorio.pdf');
            setIsPDFMenuOpen(false);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Erro ao gerar PDF. Verifique as bibliotecas 'jspdf' e 'jspdf-autotable'.");
        }
    };

    const gerarPDFSimplesParaImpressao = () => {
        try {
            const doc = new jsPDF();
            doc.text(`Lista de Compras para o Limite: R$ ${parseFloat(valorPreDefinido || 0).toFixed(2)}`, 10, 10);
            doc.setFontSize(12);
            const tableColumn = ["Item", "Quantidade", "Marcar"];
            const tableRows = produtos.map((produto) => [
                produto.nome,
                produto.quantidade,
                "(    )"
            ]);
            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 20,
                styles: { fontSize: 10 },
                columnStyles: {
                    1: { cellWidth: 30, halign: 'center' },
                    2: { cellWidth: 30, halign: 'center' }
                }
            });
            doc.output('dataurlnewwindow');
            setIsPDFMenuOpen(false);
        } catch (error) {
            console.error("Erro ao gerar PDF Simples:", error);
            alert("Erro ao gerar PDF Simples. Verifique as bibliotecas 'jspdf' e 'jspdf-autotable'.");
        }
    };

    const totalCompraCalculado = calcularTotalCompra().toFixed(2);
    const valorRestanteCalculado = (parseFloat(valorPreDefinido || 0) - parseFloat(totalCompraCalculado)).toFixed(2);
    const isOverBudget = valorRestanteCalculado < 0;

    // --- RENDERIZAÇÃO DO COMPONENTE ---
    return (
        // O container principal usa flex-col para empilhar o header e o conteúdo rolável
        <div className={`min-h-screen relative flex flex-col transition-colors duration-500 ${modoNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
            
            {/* Botões fixos (Home/Tema) */}
            {onGoHome && (
                <button 
                    onClick={onGoHome}
                    className="fixed top-4 left-4 z-50 p-3 rounded-full shadow-lg transition duration-300 text-sm font-semibold
                                             bg-white text-gray-800 hover:bg-gray-200 
                                             dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                >
                    🏠
                </button>
            )}
            <button 
                onClick={onToggleModoNoturno}
                className="fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition duration-300 text-sm font-semibold
                                             bg-white text-gray-800 hover:bg-gray-200 
                                             dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
                {modoNoturno ? '☀️' : '🌙'}
            </button>

            {/* CABEÇALHO FIXO (Título, Orçamento e Resumo) */}
            <header className={`sticky top-0 z-40 w-full transition-colors duration-500 pt-16 pb-4 ${modoNoturno ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <div className="container mx-auto max-w-4xl px-6">
                    <h1 className="text-center text-4xl font-extrabold pb-4">
                        Controle de Orçamento 🎯
                    </h1>

                    {/* Seção de Valor Pré-Definido (Fixo/Editável) */}
                    <div className={`p-4 rounded-xl shadow-lg border-2 mb-4 ${isOverBudget ? 'border-red-500' : 'border-blue-500'} ${modoNoturno ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex justify-between items-center mb-3">
                             <label className="text-lg font-semibold">Orçamento Máximo (R$)</label>
                             {/* Botão de Editar visível apenas fora do modo de edição */}
                             {!isBudgetEditing && (
                                 <button
                                     onClick={() => setIsBudgetEditing(true)}
                                     className="bg-orange-500 text-white font-semibold rounded-lg p-2 px-4 text-sm hover:bg-orange-600 transition"
                                 >
                                     Editar
                                 </button>
                             )}
                        </div>

                        {isBudgetEditing ? (
                            <div className='flex gap-2'>
                                <input
                                    type="number"
                                    placeholder="Ex: 100.00"
                                    value={valorPreDefinido}
                                    onChange={(e) => setValorPreDefinido(e.target.value)}
                                    className={`border rounded-lg p-2 w-full text-lg focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 ${modoNoturno ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'}`}
                                />
                                <button
                                    onClick={() => handleSetBudget(valorPreDefinido)}
                                    className="bg-green-500 text-white font-semibold rounded-lg p-2 px-4 hover:bg-green-600 transition"
                                >
                                    Salvar
                                </button>
                            </div>
                        ) : (
                            <div className='flex justify-between items-center'>
                                <p className='text-3xl font-bold text-blue-600 dark:text-blue-400'>
                                    R$ {parseFloat(valorPreDefinido || 0).toFixed(2)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Conteúdo que ROLA (Tabela, Botões e Totais Finais) */}
            <div className="container mx-auto max-w-4xl px-6 flex-grow overflow-y-auto mt-2 ">
                
                {/* Mensagem de Erro (Fica fixa, se houver) */}
                {erro && (
                    <div className={`p-3 mb-4 rounded-lg font-semibold text-center ${erro.includes('Orçamento') ? 'bg-yellow-400 text-gray-900' : 'bg-red-500 text-white'}`}>
                        {erro}
                    </div>
                )}

                {/* Área da Tabela */}
                <div className={`p-4 mb-4 rounded-xl shadow-lg overflow-y-scroll max-h-96 border ${modoNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    {/* CABEÇALHO DA TABELA (Desktop/Tablet) */}
                    <div className="hidden sm:block border-b-2 border-gray-300 dark:border-gray-600">
                        <div className="flex uppercase text-sm font-bold w-full"> 
                            <div className={`px-4 py-3 text-left ${COL_NOME}`}>Produto</div>
                            <div className={`px-4 py-3 text-right ${COL_VALOR}`}>Valor Und.</div>
                            <div className={`px-4 py-3 text-center ${COL_QTD}`}>Qtd.</div>
                            <div className={`px-4 py-3 text-right ${COL_TOTAL}`}>Total</div>
                        </div>
                    </div>

                    {/* CORPO DA TABELA */}
                    <div>
                        {produtos.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="font-semibold text-lg mb-2">Lista de itens vazia. 📝</p>
                                <p>Adicione produtos para subtrair do seu orçamento.</p>
                            </div>
                        ) : (
                            <div>
                                {produtos.map((produto, index) => (
                                    <div 
                                        key={index} 
                                        onClick={() => handleRowClick(index)}
                                        className={`flex flex-col sm:flex-row border-b dark:border-gray-700 transition duration-100 cursor-pointer w-full relative
                                                    ${index === produtoSelecionadoIndex ? 'bg-blue-100/50 dark:bg-blue-900/70' : (index % 2 === 0 ? ' ' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50')}`}
                                    >
                                        {/* LAYOUT MOBILE (Detalhes do Cartão) */}
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

                                        {/* LAYOUT DESKTOP (Linhas da Tabela) */}
                                        <div className="hidden sm:flex w-full">
                                            <div className={`px-4 py-3 text-left flex items-center ${COL_NOME}`}>{produto.nome}</div>
                                            <div className={`px-4 py-3 text-right flex items-center justify-end ${COL_VALOR}`}>R$ {produto.valor.toFixed(2)}</div>
                                            <div className={`px-4 py-3 text-center flex items-center justify-center ${COL_QTD}`}>{produto.quantidade}</div>
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
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteProduto(index); }}
                                                    className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
                                                    title="Excluir"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Botões de Ação da Tabela */}
                <div className="p-4 mb-6 text-center flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-blue-600 text-white font-semibold rounded-lg p-3 px-8 hover:bg-blue-700 transition shadow-lg w-full sm:w-auto"
                    >
                        + Adicionar Novo Produto
                    </button>
                </div>

                {/* Saldo Restante e Total de Compras */}
                    <div className={`p-4 rounded-xl shadow-lg border-2 mb-6 ${isOverBudget ? 'border-red-500 bg-red-100/30 dark:bg-red-900/40' : 'border-green-500 bg-green-100/30 dark:bg-green-900/40'} font-bold`}>
                         <div className="flex justify-between items-center mb-2 border-b pb-2 border-gray-300 dark:border-gray-600">
                             <h3 className="text-xl">Total de Compras:</h3>
                             <span className="text-2xl text-green-600 dark:text-green-400">R$ {totalCompraCalculado}</span>
                         </div>
                         <div className="flex justify-between items-center pt-2">
                             <h3 className="text-2xl">Saldo Restante:</h3>
                             <span className={`text-3xl ${isOverBudget ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                                 R$ {valorRestanteCalculado}
                             </span>
                         </div>
                    </div>
                
                {/* Rodapé da Página: Botões de PDF e Limpar Tudo */}
                <div className="flex flex-col sm:flex-row justify-between w-full mt-4 pb-6 gap-4">
                    {/* Botões de PDF (Agrupados à esquerda ou no centro se não houver Limpar) */}
                    {/* {produtos.length > 0 && (
                        <div className="relative flex justify-center sm:justify-start w-full sm:w-auto">
                            <button 
                                onClick={() => setIsPDFMenuOpen(!isPDFMenuOpen)} 
                                className="bg-green-600 text-white font-semibold rounded-lg p-3 hover:bg-green-700 transition flex items-center w-full sm:w-auto"
                            >
                                Opções de Impressão (PDF)
                                <svg className={`w-4 h-4 ml-2 transition-transform ${isPDFMenuOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>

                            {isPDFMenuOpen && (
                                <div className={`absolute bottom-full right-0 mb-2 w-64 rounded-lg shadow-xl py-2 z-30 ${modoNoturno ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-800'} border border-gray-300 dark:border-gray-600`}>
                                    <button
                                        onClick={gerarPDF}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                                    >
                                        📥 **Download** (Relatório Completo)
                                    </button>
                                    <button
                                        onClick={gerarPDFSimplesParaImpressao}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 border-t border-gray-200 dark:border-gray-600"
                                    >
                                        🖨️ **Imprimir** (Lista Simples / Checklist)
                                    </button>
                                </div>
                            )}
                        </div>
                    )} */}
                    
                    {/* Botão Limpar Tudo (Fixo à direita ou embaixo em mobile) */}
                    <button
                        onClick={handleClearAll}
                        className="bg-red-500 text-white font-semibold rounded-lg p-3 px-8 hover:bg-red-600 transition shadow-lg w-full sm:w-auto mt-4 sm:mt-0"
                    >
                        🗑️ Limpar Tudo
                    </button>
                </div>
            </div>
            
            {/* Modal de Adicionar/Editar Produto (ESTILO ATUALIZADO) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                    <div className={`rounded-xl p-8 w-full max-w-md shadow-2xl 
                        bg-gray-800 text-gray-100 
                    `}>
                        <h2 className="text-2xl font-bold mb-6 text-white">
                            {editandoIndex !== null ? 'Editar Produto' : 'Adicionar Produto'}
                        </h2>
                        
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Nome do Produto"
                                value={nomeProduto}
                                onChange={(e) => setNomeProduto(e.target.value)}
                                className={`border border-gray-600 rounded-lg p-3 w-full 
                                    bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500
                                `}
                            />
                            <input
                                type="number"
                                placeholder="Valor (R$)"
                                value={valorProduto}
                                onChange={(e) => setValorProduto(e.target.value)}
                                className={`border border-gray-600 rounded-lg p-3 w-full 
                                    bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500
                                `}
                            />
                            <input
                                type="number"
                                placeholder="Quantidade"
                                value={quantidadeProduto}
                                onChange={(e) => setQuantidadeProduto(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className={`border border-gray-600 rounded-lg p-3 w-full 
                                    bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500
                                `}
                            />
                        </div>

                        {erro && (
                            <p className="text-red-400 font-medium mt-4">{erro}</p>
                        )}

                        <div className="mt-6 flex flex-col space-y-3">
                            {/* Botão Adicionar/Atualizar (Azul) */}
                            <button
                                onClick={handleAddProduto}
                                className="bg-blue-600 text-white font-semibold rounded-lg p-3 hover:bg-blue-700 transition w-full"
                            >
                                {editandoIndex !== null ? 'Atualizar Produto' : 'Adicionar Produto'}
                            </button>
                            {/* Botão Cancelar (Vermelho) */}
                            <button
                                onClick={handleCloseModal}
                                className="bg-red-600 text-white font-semibold rounded-lg p-3 hover:bg-red-700 transition w-full"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ValorDefinido;