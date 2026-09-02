import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./mocks/browser", () => ({
  startMockApi: jest.fn(() => Promise.resolve()),
}));

test("renders login when unauthenticated", async () => {
  render(<App />);
  expect(await screen.findByText(/Invoice App/i)).toBeInTheDocument();
});
