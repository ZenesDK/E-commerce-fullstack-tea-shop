// server.mjs
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

// 1. Схема GraphQL (SDL)
const typeDefs = `#graphql
  type Author {
    id: ID!
    name: String!
    books: [Book!]! # Связь один-ко-многим
  }

  type Book {
    id: ID!
    title: String!
    authorId: ID!
    author: Author! # Связь обратно к автору
  }

  type Query {
    books: [Book!]!
    book(id: ID!): Book
    authors: [Author!]!
  }

  type Mutation {
    createAuthor(name: String!): Author!
    createBook(title: String!, authorId: ID!): Book!
  }
`;

// 2. Данные в памяти (Mock Database)
const authors = [
  { id: '1', name: 'Дж. Р. Р. Толкин' },
  { id: '2', name: 'Гарри Поттер (Дж. К. Роулинг)' },
];

const books = [
  { id: '1', title: 'Властелин Колец', authorId: '1' },
  { id: '2', title: 'Хоббит', authorId: '1' },
  { id: '3', title: 'Философский камень', authorId: '2' },
];

// 3. Резолверы (Логика)
const resolvers = {
  Query: {
    books: () => books,
    book: (_, { id }) => books.find((b) => b.id === id),
    authors: () => authors,
  },
  Mutation: {
    createAuthor: (_, { name }) => {
      const newAuthor = { id: String(authors.length + 1), name };
      authors.push(newAuthor);
      return newAuthor;
    },
    createBook: (_, { title, authorId }) => {
      const newBook = { id: String(books.length + 1), title, authorId };
      books.push(newBook);
      return newBook;
    },
  },
  // Вложенные резолверы для связей
  Book: {
    author: (parent) => authors.find((a) => a.id === parent.authorId),
  },
  Author: {
    books: (parent) => books.filter((b) => b.authorId === parent.id),
  },
};

// 4. Запуск сервера
const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });

console.log(`🚀 Apollo Server ready at: ${url}`);