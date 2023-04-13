import Head from "next/head";

function MyApp({ Component }) {
  return (
      <div>
        <Head>
          <title>NeuralSpace</title>
          <meta name="description" content="NeuralSpace" />
          <link rel="icon" href="/favicon.svg" />
        </Head>
        <Component />
      </div>
  );
}

export default MyApp;
