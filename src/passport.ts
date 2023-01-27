import passport from "passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { getRepository } from "typeorm";

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SECRET,
};

// const verifyUser = async (jwt_payload: any, done: any) => {
//   const user: User | undefined = await getRepository(User).findOne({
//     id: jwt_payload.id,
//   });

//   try {
//     if (user !== null) {
//       return done(null, user);
//     } else {
//       return done(null, false);
//     }
//   } catch (error) {
//     return done(error, false);
//   }
// };

// export const authenticateJwt = (req: any, res: any, next: any) =>
//   passport.authenticate("jwt", { session: false }, (error, user) => {
//     if (user) {
//       req.user = user;
//     }
//     next();
//   })(req, res, next);

// passport.use(new Strategy(jwtOptions, verifyUser));
// passport.initialize();
