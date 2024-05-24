const predictClassification = require("../services/inferenceService");
const crypto = require("crypto");
const storeData = require("../services/storeData");

async function postPredictHandler(request, h) {
  const { image } = request.payload;
  const { model } = request.server.app;

  const { resultScore, result, suggestion } = await predictClassification(
    model,
    image
  );
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const data = {
    id,
    result,
    suggestion,
    createdAt,
  };

  await storeData(id, data);
  return h
    .response({
      status: "success",
      message:
        resultScore > 99
          ? "Model is predicted successfully"
          : "Model is predicted successfully",
      data,
    })
    .code(201);
}

module.exports = postPredictHandler;