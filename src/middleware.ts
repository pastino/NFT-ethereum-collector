export const isAuthenticated = (request: any) => {
  if (!request.user) {
    console.log("You have to login");
  } else {
    return;
  }
};
