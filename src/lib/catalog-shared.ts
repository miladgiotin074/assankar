export type WageRow = {
  label: string;
  packs: number;
  amount: number;
};

export type CatalogCard = {
  id: string;
  title: string;
  image: string;
  note: string;
  wages: WageRow[];
};

export type ChoiceItem = {
  productId: string;
  title: string;
  image: string;
  quantity: number;
  label: string;
  amount: number;
};

export const maxChoices = 3;
