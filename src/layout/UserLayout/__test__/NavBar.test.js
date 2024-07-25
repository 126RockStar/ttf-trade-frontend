import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route } from "react-router-dom";
import NavBar from "../components/NavBar";
import { useHistory } from "react-router-dom";

const mockHistoryPush = jest.fn();
jest.mock("react-router-dom", () => ({
	useHistory: () => ({
		push: mockHistoryPush,
	}),
}));

const Urls = {
	home: "/home",
	account: "/account",
	help: "/help",
};

it("home navigation button hover", async () => {
	render(<NavBar />);

	const homeBtnElement = screen.getByTestId("home-btn");
	userEvent.hover(homeBtnElement);
	expect(homeBtnElement).toBeInTheDocument();
	userEvent.unhover(homeBtnElement);
	expect(homeBtnElement).toBeInTheDocument();
});

it("home navigation button click", async () => {
	render(<NavBar />);

	const homeBtnElement = screen.getByTestId("home-btn");
	fireEvent.click(homeBtnElement);
	expect(mockHistoryPush).toBeCalledWith(Urls.home);
});

it("account navigation button hover", async () => {
	render(<NavBar />);

	const accountBtnElement = screen.getByTestId("account-btn");
	userEvent.hover(accountBtnElement);
	expect(accountBtnElement).toBeInTheDocument();
	userEvent.unhover(accountBtnElement);
	expect(accountBtnElement).toBeInTheDocument();
});

it("account navigation button click", async () => {
	render(<NavBar />);

	const accountBtnElement = screen.getByTestId("account-btn");
	fireEvent.click(accountBtnElement);
	expect(mockHistoryPush).toBeCalledWith(Urls.account);
});

it("help navigation button hover", async () => {
	render(<NavBar />);

	const helpBtnElement = screen.getByTestId("help-btn");
	userEvent.hover(helpBtnElement);
	expect(helpBtnElement).toBeInTheDocument();
	userEvent.unhover(helpBtnElement);
	expect(helpBtnElement).toBeInTheDocument();
});

it("help navigation button click", async () => {
	render(<NavBar />);

	const helpBtnElement = screen.getByTestId("help-btn");
	fireEvent.click(helpBtnElement);
	expect(mockHistoryPush).toBeCalledWith(Urls.help);
});
