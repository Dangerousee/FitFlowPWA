import { buildSelectQuery } from './query-builder';
import { FetchMode } from '@lib/server/db';

// 예시 1: 특정 필드만 선택적으로 가져오기
async function getUserEmailAndNickname(userId: string) {
  const { data, error } = await buildSelectQuery(
    'users',
    { id: userId },
    FetchMode.SINGLE,
    { fields: ['email', 'nickname'] } // fields 옵션 사용
  );

  if (error) {
    console.error('Error fetching user:', error);
  } else {
    console.log('User email and nickname:', data);
  }
}

// 예시 2: 조인된 필드를 선택적으로 가져오기
async function getPostWithAuthorNickname(postId: string) {
  const { data, error } = await buildSelectQuery(
    'posts',
    { id: postId },
    FetchMode.SINGLE,
    { joinFields: 'author:users(nickname)' } // joinFields 옵션 사용
  );

  if (error) {
    console.error('Error fetching post with author:', error);
  } else {
    console.log('Post with author nickname:', data);
  }
}

// 예시 3: 필드와 조인을 함께 사용 (LIST 모드)
async function getCommentsWithUserAndPostDetails(commentId: string) {
  const { data, error } = await buildSelectQuery(
    'comments',
    { id: commentId },
    FetchMode.LIST, // LIST 모드 명시
    {
      fields: ['id', 'content'], // 댓글의 id와 content 필드
      joinFields: 'user:users(id, email), post:posts(title)' // 사용자 정보와 게시글 제목 조인
    }
  );

  if (error) {
    console.error('Error fetching comments with details:', error);
  } else {
    console.log('Comments with user and post details:', data);
  }
}

// 함수 호출 예시 (실제 사용 시 주석 해제)
// getUserEmailAndNickname('some-user-id');
// getPostWithAuthorNickname('some-post-id');
// getCommentsWithUserAndPostDetails('some-comment-id');