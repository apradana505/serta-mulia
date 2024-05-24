require("dotenv").config();

const Hapi = require("@hapi/hapi");
const routes = require("../server/routes");
const loadModel = require("../services/loadModel");
const InputError = require("../exceptions/InputError");

(async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    routes: {
      cors: {
        origin: ["*"],
      },
      payload: {
        maxBytes: 1000000,
      },
    },
  });

  const model = await loadModel();
  server.app.model = model;

  server.route(routes);

  server.ext("onPreResponse", function (request, h) {
    const response = request.response;

    if (response instanceof InputError) {
      const statusCode = parseInt(response.statusCode, 10);
      console.log("Caught InputError, setting status code to:", statusCode);
      const newResponse = h.response({
        status: "fail",
        message: `Terjadi kesalahan dalam melakukan prediksi`,
      });
      newResponse.code(statusCode);
      return newResponse;
    }

    if (response.isBoom) {
      const statusCode = parseInt(response.output.statusCode, 10);
      console.log("Caught Boom error, setting status code to:", statusCode);
      const newResponse = h.response({
        status: "fail",
        message: response.message,
      });
      newResponse.code(statusCode);
      return newResponse;
    }

    if (request.payload && request.payload.length > 1000000) {
      console.log("Payload too large, setting status code to 413");
      const newResponse = h.response({
        status: "fail",
        message: "Payload content length greater than maximum allowed: 1000000",
      });
      newResponse.code(413);
      return newResponse;
    }

    if (response.statusCode === 400) {
      console.log("Setting status code to 400 for response.statusCode === 400");
      const newResponse = h.response({
        status: "fail",
        message: "Terjadi kesalahan dalam melakukan prediksi",
      });
      newResponse.code(400);
      return newResponse;
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server start at: ${server.info.uri}`);
})();