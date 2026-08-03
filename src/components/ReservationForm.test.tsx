import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useActionState: <State, Payload>(
      action: (state: State, payload: Payload) => Promise<State>,
      initialState: State,
    ) => {
      const [state, setState] = react.useState(initialState);
      const formAction = async (payload: Payload) => {
        setState(await action(state, payload));
      };
      return [state, formAction, false] as const;
    },
  };
});

vi.mock("@/app/actions", () => ({
  createReservation: vi.fn(async () => ({
    ok: false,
    message: "Test sans envoi serveur",
  })),
  cancelReservation: vi.fn(async () => ({
    ok: true,
    message: "Réservation annulée",
  })),
}));

vi.mock("react-dom", async (importOriginal) => {
  const reactDom = await importOriginal<typeof import("react-dom")>();
  return { ...reactDom, useFormStatus: () => ({ pending: false }) };
});

import { ReservationForm } from "@/components/ReservationForm";

describe("ReservationForm — parcours mobile", () => {
  it("valide et parcourt les trois étapes avec un récapitulatif modifiable", async () => {
    const user = userEvent.setup();
    render(<ReservationForm />);

    expect(
      screen.getByRole("heading", { name: "Date & heure" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Date")).toHaveClass(
      "reservation-date-input",
      "min-w-0",
      "max-w-full",
      "overflow-hidden",
    );

    await user.click(screen.getByRole("button", { name: "Continuer" }));
    expect(screen.getByText("Choisissez une date.")).toBeInTheDocument();
    expect(screen.getAllByText("Choisissez un créneau.")).toHaveLength(2);

    await user.type(screen.getByLabelText("Date"), "2099-08-03");
    await user.selectOptions(screen.getByLabelText("Créneau"), "20:00");
    await user.click(screen.getByRole("button", { name: "Continuer" }));

    expect(
      screen.getByRole("heading", { name: "Vos coordonnées" }),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nom et prénom"), "Mariam Diallo");
    await user.type(
      screen.getByLabelText("Adresse e-mail"),
      "mariam@example.com",
    );
    await user.type(screen.getByLabelText("Téléphone"), "0612345678");
    await user.click(
      screen.getByRole("button", { name: "Vérifier ma réservation" }),
    );

    expect(
      screen.getByRole("heading", { name: "Vérifiez votre réservation" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Mariam Diallo")).toBeInTheDocument();
    expect(screen.getByText("mariam@example.com")).toBeInTheDocument();
    expect(screen.getByText(/2 personnes/)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Modifier" })[0]);
    expect(
      screen.getByRole("heading", { name: "Date & heure" }),
    ).toBeInTheDocument();
  });
});
