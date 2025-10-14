import React, { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

const ModalProduto = ({
  isOpen,
  onClose,
  onSalvar,
  produtoEditando,
  modoNoturno
}) => {
  const [ean, setEan] = useState("");
  const [nomeProduto, setNomeProduto] = useState("");
  const [valorProduto, setValorProduto] = useState("");
  const [quantidadeProduto, setQuantidadeProduto] = useState("");
  const [erro, setErro] = useState("");
  const [leitorAtivo, setLeitorAtivo] = useState(false);
  const codeReaderRef = useRef(null);

  // 🔹 Preenche dados se estiver editando
  useEffect(() => {
    if (produtoEditando) {
      setEan(produtoEditando.ean || "");
      setNomeProduto(produtoEditando.nome || "");
      setValorProduto(produtoEditando.valor?.toString() || "");
      setQuantidadeProduto(produtoEditando.quantidade?.toString() || "");
    } else {
      setEan("");
      setNomeProduto("");
      setValorProduto("");
      setQuantidadeProduto("");
    }
  }, [produtoEditando]);

  // 🔹 Busca produto por EAN
  const buscarProdutoPorEan = async (codigoEan) => {
    if (!codigoEan) {
      setErro("Informe um código EAN válido.");
      setTimeout(() => setErro(""), 1500);
      return;
    }

    try {
      const apiKey = "4210726968ED3C18";
      const urlEanData = `https://eandata.com/feed/?v=3&keycode=${apiKey}&mode=json&find=${codigoEan}`;
      const responseEan = await fetch(urlEanData);
      const dataEan = await responseEan.json();

      const produtoValido =
        dataEan &&
        dataEan.product &&
        (dataEan.product.title || dataEan.product.attributes?.product);

      if (produtoValido) {
        const nome =
          dataEan.product.attributes?.product ||
          dataEan.product.title ||
          "Produto não identificado";
        setNomeProduto(nome);
        setErro("");
        return;
      }

      // Caso EANData não encontre, tenta MockAPI
      const mockApiUrl = "https://68ed848edf2025af780067e3.mockapi.io/gestor/produtos";
      const responseMock = await fetch(`${mockApiUrl}?ean=${codigoEan}`);
      const dataMock = await responseMock.json();

      if (Array.isArray(dataMock) && dataMock.length > 0) {
        const produtoMock = dataMock[0];
        setNomeProduto(produtoMock.nome);
        setErro("");
        return;
      }

      setErro("Produto não encontrado.");
      setNomeProduto("");
      setTimeout(() => setErro(""), 2000);

    } catch (err) {
      console.error("Erro ao consultar produto:", err);
      setErro("Erro ao consultar o produto. Tente novamente.");
      setTimeout(() => setErro(""), 2000);
    }
  };

  // 🔹 Scanner
  useEffect(() => {
    if (!leitorAtivo) {
      if (codeReaderRef.current) codeReaderRef.current.reset();
      return;
    }

    const initScanner = async () => {
      try {
        const codeReader = new BrowserMultiFormatReader();
        codeReaderRef.current = codeReader;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === "videoinput");

        const backCameras = videoDevices.filter(d =>
          /back|rear|environment|traseira/i.test(d.label)
        );
        let mainCamera =
          backCameras[1] || backCameras[0] || videoDevices[0] || videoDevices[1];

        if (!mainCamera) throw new Error("Nenhuma câmera disponível.");

        await codeReader.decodeFromConstraints(
          { video: { deviceId: { exact: mainCamera.deviceId } } },
          "video",
          (result, err) => {
            if (result) {
              const codigo = result.getText();
              setEan(codigo);
              buscarProdutoPorEan(codigo);
              setLeitorAtivo(false);
              codeReader.reset();
            }
          }
        );
      } catch (err) {
        console.error("Erro ao acessar a câmera:", err);
        setErro("Erro ao acessar a câmera. Verifique permissões.");
      }
    };

    initScanner();

    return () => {
      if (codeReaderRef.current) codeReaderRef.current.reset();
    };
  }, [leitorAtivo]);

  const handleSalvar = () => {
    if (!nomeProduto || !valorProduto || !quantidadeProduto) {
      setErro("Preencha todos os campos!");
      setTimeout(() => setErro(""), 1500);
      return;
    }

    const produto = {
      ean,
      nome: nomeProduto,
      valor: parseFloat(valorProduto),
      quantidade: parseInt(quantidadeProduto),
      total: parseFloat(valorProduto) * parseInt(quantidadeProduto),
    };

    onSalvar(produto);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className={`p-8 rounded-xl shadow-2xl w-full max-w-lg ${modoNoturno ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <h1 className="text-2xl font-bold mb-6">
          {produtoEditando ? "Editar Produto" : "Adicionar Produto"}
        </h1>

        {leitorAtivo && (
          <div className="mb-4">
            <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden">
              <video id="video" className="w-full h-full object-cover" autoPlay muted />
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-500"></div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <input
            type="number"
            placeholder="EAN do Produto"
            value={ean}
            onChange={(e) => setEan(e.target.value)}
            className="border rounded-xl p-3 dark:bg-gray-700"
          />

          <div className="flex gap-3">
            <button
              onClick={() => buscarProdutoPorEan(ean)}
              className="flex-1 bg-blue-600 text-white py-2 rounded-xl"
            >
              Buscar
            </button>
            <button
              onClick={() => setLeitorAtivo(!leitorAtivo)}
              className={`flex-1 py-2 rounded-xl text-white ${leitorAtivo ? "bg-red-600" : "bg-green-600"}`}
            >
              {leitorAtivo ? "Parar" : "Ler Código"}
            </button>
          </div>

          <input
            type="text"
            placeholder="Nome do Produto"
            value={nomeProduto}
            onChange={(e) => setNomeProduto(e.target.value)}
            className="border rounded-xl p-3 dark:bg-gray-700"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Valor (R$)"
              value={valorProduto}
              onChange={(e) => setValorProduto(e.target.value)}
              className="border rounded-xl p-3 dark:bg-gray-700"
            />
            <input
              type="number"
              placeholder="Quantidade"
              value={quantidadeProduto}
              onChange={(e) => setQuantidadeProduto(e.target.value)}
              className="border rounded-xl p-3 dark:bg-gray-700"
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={handleSalvar}
              className="flex-1 bg-blue-600 text-white py-2 rounded-xl"
            >
              Salvar
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-red-600 text-white py-2 rounded-xl"
            >
              Cancelar
            </button>
          </div>

          {erro && <p className="text-red-500 font-medium mt-2">{erro}</p>}
        </div>
      </div>
    </div>
  );
};

export default ModalProduto;
