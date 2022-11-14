const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        users: async () => {
            return User.find().populate('books');
        },
        user: async (parent, { username }) => {
            return User.findOne({ username }).populate('books');
        },
        books: async () => {
            return Book.find()
        },
        book: async (parent, { bookId }) => {
            return Book.findOne({ bookId })
        },
        me: async (parent, args, context) => {
            if (context.user) {
                return User.findOne({ _id: context.user._id }).populate('books');
            }
            throw new AuthenticationError('You must be logged in!');
        },
    },

    Mutation: {
        createUser: async (parent, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);
            return { token, user };

        },
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('No user found with this email address');
            }

            const authPw = await user.isCorrectPassword(password);

            if (!authPw) {
                throw new AuthenticationError('Incorrect login credentials');
            }

            const token = signToken(user);

            return { token, user };

        },
        saveBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const addBook = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { books: bookId } }
                );

                return addBook
            };

            throw new AuthenticationError('Error, you need to be logged in!');
        },
        deleteBook: async (parent, { userId, bookId }) => {
            if (context.user) {
                const deleteBook = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { books: bookId } }
                );

                return deleteBook
            };

            throw new AuthenticationError('Error, you need to be logged in!');
        }
    },


}


module.exports = resolvers;