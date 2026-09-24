export const errorMiddleware = (err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({
        succes: false,
        message: "Error interno del servidor",
    });
};
