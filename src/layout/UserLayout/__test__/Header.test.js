import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Header from "../components/Header";

it("should render same text passed into title prop", async () => {
	const userInfo = {
		userInfo: "trading-test-dev",
	};

	render(<Header userInfo={userInfo} />);
	const headingElement = screen.getByTestId("header");
	expect(headingElement).toBeInTheDocument();
});
