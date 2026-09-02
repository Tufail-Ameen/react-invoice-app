import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import App from "./App";
import { store } from "./app/store";

jest.mock("./mocks/browser", () => ({
  startMockApi: jest.fn(() => Promise.resolve()),
}));

test("renders login when unauthenticated", async () => {
  render(
    <Provider store={store}>
      <App />
    </Provider>
  );
  expect(await screen.findByText(/Invoice App/i)).toBeInTheDocument();
});
