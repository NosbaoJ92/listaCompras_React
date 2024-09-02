<div className="flex flex-col sm:flex-row gap-2">
  {valorMaximoConfirmado ? (
    <IconButton onClick={() => setValorMaximoConfirmado(null)}>
      <EditIcon />
    </IconButton>
  ) : (
    <>
      <input
        type="number"
        placeholder="Ex: 100.00"
        value={valorMaximo}
        onChange={(e) => setValorMaximo(e.target.value)}
        className={`border rounded-md p-2 flex-1 ${modoNoturno ? 'bg-gray-700 text-white' : 'text-black'}`}
      />
      <div className="flex justify-between gap-2">
        <button
          onClick={confirmarValorMaximo}
          className="bg-green-500 w-6/12 text-white rounded-md p-2 hover:bg-green-600"
        >
          Confirmar Valor Máximo
        </button>
        <button
          onClick={() => setValorMaximo('')}
          className="bg-red-500 w-6/12 text-white rounded-md p-2 hover:bg-red-600"
        >
          Cancelar
        </button>
      </div>
    </>
  )}
</div>
