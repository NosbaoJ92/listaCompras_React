import { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

const GestorEAN = () => {
  const [ean, setEan] = useState("");
  const [nomeProduto, setNomeProduto] = useState("");
  const [valorProduto, setValorProduto] = useState("");
  const [leitorAtivo, setLeitorAtivo] = useState(false);
  const [produtosColetados, setProdutosColetados] = useState([]);
  const [erro, setErro] = useState("");

  const codeReaderRef = useRef(null);

  // Inicia scanner
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

        const mainCamera = videoDevices[0];
        if (!mainCamera) throw new Error("Nenhuma câmera disponível.");

        await codeReader.decodeFromConstraints(
          { video: { deviceId: { exact: mainCamera.deviceId } } },
          "video",
          (result, err) => {
            if (result) {
              const codigo = result.getText();
              setEan(codigo);
              setLeitorAtivo(false);
            }
          }
        );
      } catch (err) {
        console.error(err);
        setErro("Erro ao acessar a câmera.");
      }
    };

    initScanner();

    return () => {
      if (codeReaderRef.current) codeReaderRef.current.reset();
    };
  }, [leitorAtivo]);

  // Adiciona produto manualmente ou do scanner
  const handleAddProduto = () => {
    if (!ean || !nomeProduto || !valorProduto) {
      setErro("Preencha todos os campos!");
      setTimeout(() => setErro(""), 1500);
      return;
    }

    const novoProduto = {
      ean,
      nome: nomeProduto,
      valor: parseFloat(valorProduto),
    };

    setProdutosColetados([...produtosColetados, novoProduto]);
    setEan("");
    setNomeProduto("");
    setValorProduto("");
  };

  // Envia produtos para MockAPI
  const handleEnviarMockAPI = async () => {
    try {
      for (const produto of produtosColetados) {
        await fetch("https://68ed848edf2025af780067e3.mockapi.io/gestor/produtos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(produto),
        });
      }
      alert("Produtos enviados com sucesso!");
      setProdutosColetados([]);
    } catch (err) {
      console.error(err);
      setErro("Erro ao enviar para o MockAPI.");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
        Coletor de Produtos - Gestor
      </h1>

      {/* Scanner */}
      {leitorAtivo && (
        <div className="mb-4 relative w-full max-w-md mx-auto">
          <video
            id="video"
            className="w-full h-64 object-cover rounded-lg border-2 border-green-500"
            autoPlay
          />
          <div className="absolute inset-0 border-4 border-red-500 opacity-60 pointer-events-none"></div>
        </div>
      )}

      {/* Input Manual */}
      <div className="max-w-md mx-auto flex flex-col gap-3">
        <input
          type="text"
          placeholder="EAN"
          value={ean}
          onChange={e => setEan(e.target.value)}
          className="border p-3 rounded-lg text-gray-700 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
        />
        <input
          type="text"
          placeholder="Nome do Produto"
          value={nomeProduto}
          onChange={e => setNomeProduto(e.target.value)}
          className="border p-3 rounded-lg text-gray-700 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
        />
        <input
          type="number"
          placeholder="Valor (R$)"
          value={valorProduto}
          onChange={e => setValorProduto(e.target.value)}
          className="border p-3 rounded-lg text-gray-700 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
        />

        <div className="flex gap-3">
          <button
            onClick={handleAddProduto}
            className="flex-1 bg-blue-600 text-white font-semibold rounded-xl py-2 hover:bg-blue-700 transition"
          >
            Adicionar Produto
          </button>
          <button
            onClick={() => setLeitorAtivo(!leitorAtivo)}
            className={`flex-1 font-semibold rounded-xl py-2 transition ${
              leitorAtivo
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {leitorAtivo ? "Parar Leitura" : "Ler Código"}
          </button>
        </div>
      </div>

      {erro && <p className="text-red-500 text-center mt-2">{erro}</p>}

      {/* Lista de produtos coletados */}
      {produtosColetados.length > 0 && (
        <div className="mt-6 max-w-md mx-auto bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            Produtos Coletados
          </h2>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {produtosColetados.map((p, i) => (
              <li key={i} className="py-2 flex justify-between">
                <span>{p.nome}</span>
                <span className="font-semibold">R$ {p.valor.toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={handleEnviarMockAPI}
            className="mt-4 w-full bg-purple-600 text-white font-semibold rounded-xl py-2 hover:bg-purple-700 transition"
          >
            Enviar para MockAPI
          </button>
        </div>
      )}
    </div>
  );
};

export default GestorEAN;
