window.GremioAPI = (() => {
  let counter = 0;

  function call(params) {
    return new Promise((resolve, reject) => {
      const callback =
        "__gremio_jsonp_" +
        Date.now() +
        "_" +
        (++counter);

      const script =
        document.createElement("script");

      const query =
        new URLSearchParams({
          ...params,
          callback
        }).toString();

      let finished = false;

      function cleanup() {
        if (finished) return;
        finished = true;
        delete window[callback];
        script.remove();
      }

      window[callback] = function(data) {
        cleanup();

        if (!data) {
          reject(new Error("Resposta vazia da API."));
          return;
        }

        if (data.ok === false) {
          reject(
            new Error(
              data.message ||
              "A API retornou um erro."
            )
          );
          return;
        }

        resolve(data);
      };

      script.onerror = function() {
        cleanup();
        reject(
          new Error(
            "Não foi possível conectar ao Google Apps Script."
          )
        );
      };

      script.src =
        window.GREMIO_CONFIG.GAS_URL +
        "?" +
        query;

      document.body.appendChild(script);

      setTimeout(() => {
        if (!finished) {
          cleanup();
          reject(
            new Error(
              "Tempo esgotado ao conectar com a API."
            )
          );
        }
      }, 15000);
    });
  }

  return { call };
})();
