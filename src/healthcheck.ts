import { Hono } from "hono";

export const healthcheckRoute = new Hono();

healthcheckRoute.get("/", async (c) => {
  return c.json(
    {
      message: "Server is up and running! 🚀",
    },
    200
  );
});
