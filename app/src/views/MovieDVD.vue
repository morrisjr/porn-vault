<template>
  <div style="height: 100vh; width: 100%">
    <v-progress-circular
      class="loader"
      v-if="!movie"
      color="primary"
      :width="4"
      :size="35"
      indeterminate
    ></v-progress-circular>
    <DVDRenderer
      style="height: 100%; width: 100%"
      v-if="movie"
      :movieName="movie.name"
      :studioName="movie.studio ? movie.studio.name : ''"
      :frontCover="frontCover"
      :backCover="backCover"
      :spineCover="spineCover"
      :light="light"
      :showDetails="true"
      :showAutoRotate="true"
      :showControls="false"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import IMovie from "../types/movie";
import movieFragment from "@/fragments/movie";
import studioFragment from "@/fragments/studio";
import ApolloClient, { serverBase } from "@/apollo";
import DVDRenderer from "@/components/DVDRenderer.vue";
import gql from "graphql-tag";

@Component({
  components: {
    DVDRenderer,
  },
})
export default class MovieDVD extends Vue {
  movie: IMovie | null = null;

  get frontCover() {
    if (!this.movie) {
      return "";
    }

    if (this.movie.frontCover) {
      return `${serverBase}/media/image/${
        this.movie.frontCover._id
      }?password=${localStorage.getItem("password")}`;
    }
    return "";
  }

  get backCover() {
    if (!this.movie) {
      return "";
    }

    if (this.movie.backCover) {
      return `${serverBase}/media/image/${this.movie.backCover._id}?password=${localStorage.getItem(
        "password"
      )}`;
    }
    return this.frontCover;
  }

  get spineCover() {
    if (!this.movie) {
      return "";
    }

    if (this.movie.spineCover) {
      return `${serverBase}/media/image/${
        this.movie.spineCover._id
      }?password=${localStorage.getItem("password")}`;
    }
    return null;
  }

  get light() {
    return this.$route.query.light === null || this.$route.query.light === "true";
  }

  onLoad() {
    console.log("load", this.$route.params.id);
    ApolloClient.query({
      query: gql`
        query($id: String!) {
          getMovieById(id: $id) {
            ...MovieFragment
            studio {
              ...StudioFragment
            }
          }
        }
        ${movieFragment}
        ${studioFragment}
      `,
      variables: {
        id: (<any>this).$route.params.id,
      },
    }).then((res) => {
      this.movie = res.data.getMovieById;
    });
  }

  beforeMount() {
    this.onLoad();
  }
}
</script>

<style lang="scss" scoped>
.loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
