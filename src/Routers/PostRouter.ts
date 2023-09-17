import express from 'express';
import { authCheck } from '../Controllers/AuthController';
import { PostCreate, allPost, dislike, like, userPost,deletePost } from '../Controllers/PostController';
import { allComments, createComment, deleteComment } from '../Controllers/CommentController';
import { uploadFile } from '../Utils/multerConfig';
import { sharpConfig } from '../Utils/sharpConfigMiddleware';
import { cloudinaryConfig } from '../Utils/cloudinaryConfigMiddleware';

const Router = express.Router();

Router.use(authCheck);                                         //authentication check

Router.route('/').get(allPost);                                //fetching all posts
Router.route('/singleUser/:id').get(userPost)                             //fetching single user's post
Router.route('/like/:postID').post(like);                      //liking a post
Router.route('/dislike/:postID').post(dislike);                //disliking a post

Router.route('/new').post(uploadFile,sharpConfig,cloudinaryConfig,PostCreate);                         //create a post
Router.route('/delete/:id').delete(deletePost);                //deleting a post

Router.route('/comments/:postID').get(allComments);            //fetching all comment of a post
Router.route('/comments/new').post(createComment);             //creating a comment
Router.route('/comments/:commentID').delete(deleteComment);    //deleting a comment

export default Router;