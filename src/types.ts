export type RandomUser = {
  gender: string;
  name: {
    title: string;
    first: string;
    last: string;
  };
  email: string;
  phone: string | null;
};

export type RandomUserResponse = {
  results: RandomUser[];
};